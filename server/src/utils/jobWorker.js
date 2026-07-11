import Job from '../models/Job.js';
import Repository from '../models/Repository.js';
import FileNode from '../models/FileNode.js';
import User from '../models/User.js';
import { cloneRepository, parseGitUrl, cleanupDirectory } from './git.js';
import { parseRepository } from './parser.js';
import { generateRepoOverview, generateFileSummaries, indexRepositoryForChat } from './langchainHelper.js';
import { calcRepoCost, deductCredits, addCredits, logUsage } from './creditHelper.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Background worker task to execute the full clone, parsing, and analysis sequence.
 * Updates the Job document state at each step.
 * @param {string} jobId 
 */
export const processRepositoryJob = async (jobId, userKeys = null) => {
  let tempPath = null;
  let job = null;
  let creditsCharged = 0; // track how many credits we actually charged

  try {
    // 1. Fetch the job from MongoDB
    job = await Job.findById(jobId);
    if (!job) {
      console.error(`Background job ${jobId} not found.`);
      return;
    }

    // 2. Transition status to processing
    job.status = 'processing';
    job.progress = 'Cloning git repository...';
    job.updatedAt = new Date();
    await job.save();

    const repoUrl = job.gitUrl.trim();
    const targetBranch = job.branch.trim();
    const { owner, name } = parseGitUrl(repoUrl);

    // 3. Clone Repository securely (this triggers checkRepositoryLimits automatically)
    const cloneResult = await cloneRepository(repoUrl, targetBranch);
    tempPath = cloneResult.tempPath;
    const resolvedBranch = cloneResult.branch || 'main';

    // 4. Update progress
    job.progress = 'Parsing codebase structure...';
    job.updatedAt = new Date();
    await job.save();

    // 5. Parse structure & dependencies
    const parseResult = await parseRepository(tempPath);

    // 5b. Deduct dynamic credits based on actual file count
    const cost = calcRepoCost(parseResult.files.length);
    const deductResult = await deductCredits(job.userId, cost);
    if (!deductResult.ok) {
      // Edge case: credits dropped between queueing and processing
      job.status = 'failed';
      job.progress = 'Analysis failed: insufficient credits.';
      job.error = `Not enough credits to analyze this repository (requires ${cost} credits, have ${deductResult.remaining}).`;
      job.updatedAt = new Date();
      await job.save();
      return;
    }
    creditsCharged = cost;
    console.log(`Charged ${cost} credits to userId ${job.userId} for ${parseResult.files.length} files. Remaining: ${deductResult.remaining}`);

    // Read README.md if it exists
    let readmeContent = '';
    const readmePaths = ['README.md', 'readme.md', 'README.MD'];
    for (const rName of readmePaths) {
      const rPath = path.join(tempPath, rName);
      if (await fs.pathExists(rPath)) {
        readmeContent = await fs.readFile(rPath, 'utf-8');
        break;
      }
    }

    // 6. Update progress to AI generation
    job.progress = 'Generating AI architectural overview...';
    job.updatedAt = new Date();
    await job.save();

    const structureSummary = {
      totalFiles: parseResult.files.length,
      totalLinesOfCode: parseResult.totalLOC,
      languages: parseResult.languages,
      files: parseResult.files
    };
    const overviewSummary = await generateRepoOverview(name, structureSummary, readmeContent, userKeys);

    // 7. Update progress to File Summaries
    job.progress = 'Generating file descriptions and indexing...';
    job.updatedAt = new Date();
    await job.save();

    const fileSummaries = await generateFileSummaries(parseResult.files, userKeys);

    // 8. Save Repository in DB (scoped to active tenant user)
    let repoObj = await Repository.findOne({ url: repoUrl, branch: resolvedBranch, userId: job.userId });
    if (!repoObj) {
      repoObj = new Repository({ url: repoUrl, owner, name, branch: resolvedBranch, userId: job.userId });
    }

    repoObj.owner = owner;
    repoObj.name = name;
    repoObj.branch = resolvedBranch;
    repoObj.totalFiles = parseResult.files.length;
    repoObj.totalLinesOfCode = parseResult.totalLOC;
    repoObj.languages = parseResult.languages;
    repoObj.summary = overviewSummary;
    repoObj.description = readmeContent ? readmeContent.substring(0, 500) : 'Public repository analysis';
    repoObj.updatedAt = new Date();
    await repoObj.save();

    // Clear old file nodes (in case of re-analysis refresh)
    await FileNode.deleteMany({ repository: repoObj._id });

    const nodesToSave = parseResult.files.map(file => ({
      repository: repoObj._id,
      path: file.path,
      name: file.name,
      type: file.type,
      size: file.size,
      language: file.language,
      linesOfCode: file.linesOfCode,
      imports: file.imports,
      exports: file.exports,
      summary: fileSummaries[file.path] || 'Source file.',
      codeSnippet: file.codeSnippet,
      parentPath: file.parentPath
    }));

    const savedNodes = await FileNode.insertMany(nodesToSave);

    // 9. Generate Vector Embeddings (saves to MongoDB)
    // Run this synchronously in the background job process
    await indexRepositoryForChat(repoObj._id.toString(), savedNodes, userKeys);

    // 10. Complete Job
    job.status = 'completed';
    job.progress = 'Analysis completed successfully.';
    job.repositoryId = repoObj._id;
    job.updatedAt = new Date();
    await job.save();

    // Log analysis usage to DB
    logUsage(job.userId, 'analyze', creditsCharged, `Analyzed repository '${owner}/${name}' (${parseResult.files.length} files)`).catch(err => {
      console.error('Failed to write analysis usage log:', err);
    });

    console.log(`Job ${jobId} successfully completed parsing for ${repoUrl}`);
  } catch (error) {
    console.error(`Background job ${jobId} failed:`, error);
    if (job) {
      job.status = 'failed';
      job.progress = 'Analysis failed.';
      job.error = error.message || 'Unknown analysis error.';
      job.updatedAt = new Date();
      await job.save();

      // Refund the exact credits charged for the failed analysis
      if (creditsCharged > 0) {
        try {
          const newBalance = await addCredits(job.userId, creditsCharged);
          console.log(`Refunded ${creditsCharged} credits to userId ${job.userId} due to background job failure. New balance: ${newBalance}`);
        } catch (refundErr) {
          console.error('Failed to refund background credit:', refundErr);
        }
      }
    }
  } finally {
    // 11. Clean up temporary files on disk
    if (tempPath) {
      await cleanupDirectory(tempPath);
    }
  }
};
