import Repository from '../models/Repository.js';
import FileNode from '../models/FileNode.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { cloneRepository, parseGitUrl, cleanupDirectory, getRemoteBranches } from '../utils/git.js';
import { parseRepository } from '../utils/parser.js';
import { generateRepoOverview, generateFileSummaries, indexRepositoryForChat } from '../utils/langchainHelper.js';
import { processRepositoryJob } from '../utils/jobWorker.js';
import fs from 'fs-extra';
import path from 'path';
import {
  isDbConnected,
  getReposListFallback,
  getRepoDetailsFallback,
  getFileNodesFallback,
  findRepoByUrlFallback,
  saveRepoFallback,
  saveFileNodesFallback
} from '../utils/dbFallback.js';

/**
 * Controller for cloning, parsing, analyzing and returning the repo dependency graph.
 * POST /api/repos/analyze
 */
export const analyzeRepo = async (req, res) => {
  const { gitUrl, branch, forceRefresh } = req.body;

  if (!gitUrl) {
    return res.status(400).json({ error: 'GitHub repository URL is required.' });
  }

  // Parse URL to check existing
  const { owner, name } = parseGitUrl(gitUrl);
  const repoUrl = gitUrl.trim();
  const targetBranch = branch ? branch.trim() : '';

  let tempPath = null;

  try {
    // 1. Check if already analyzed in DB (only if a specific branch is requested)
    if (!forceRefresh && targetBranch) {
      if (isDbConnected()) {
        const existingRepo = await Repository.findOne({ url: repoUrl, branch: targetBranch, userId: req.userId });
        if (existingRepo) {
          console.log(`Found existing analyzed repo in MongoDB: ${repoUrl} (branch: ${targetBranch})`);
          const fileNodes = await FileNode.find({ repository: existingRepo._id });
          indexRepositoryForChat(existingRepo._id.toString(), fileNodes); // trigger async check
          return res.status(200).json({
            repository: existingRepo,
            nodes: fileNodes
          });
        }
      } else {
        const existingRepo = findRepoByUrlFallback(repoUrl, targetBranch);
        if (existingRepo) {
          console.log(`Found existing analyzed repo in local cache: ${repoUrl} (branch: ${targetBranch})`);
          const fileNodes = getFileNodesFallback(existingRepo._id);
          indexRepositoryForChat(existingRepo._id.toString(), fileNodes);
          return res.status(200).json({
            repository: existingRepo,
            nodes: fileNodes
          });
        }
      }
    }

    // Verify user credits before proceeding (only for new/forced analysis when DB is available)
    let user = null;
    if (isDbConnected()) {
      user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      if (user.credits <= 0) {
        return res.status(403).json({ error: 'Insufficient credits. You have 0 credits remaining. Please buy more credits.' });
      }

      // Deduct credit
      user.credits -= 1;
      await user.save();
      console.log(`Charged 1 credit to user ${user.email}. Remaining credits: ${user.credits}`);
    }

    const userKeys = {
      geminiKey: req.headers['x-gemini-key'],
      openaiKey: req.headers['x-openai-key'],
      anthropicKey: req.headers['x-anthropic-key'],
      provider: req.headers['x-llm-provider']
    };

    // 2. Offload to background worker if DB is active
    if (isDbConnected()) {
      const job = new Job({
        gitUrl: repoUrl,
        branch: targetBranch,
        forceRefresh,
        status: 'pending',
        progress: 'Queued...',
        userId: req.userId
      });
      await job.save();

      // Launch process repository job in background with user keys
      processRepositoryJob(job._id.toString(), userKeys).catch(err => {
        console.error(`Error processing background job ${job._id}:`, err);
      });

      // Respond with 202 Accepted, the jobId, and updated credit count
      return res.status(202).json({
        message: 'Repository analysis queued successfully',
        jobId: job._id.toString(),
        credits: user ? user.credits : undefined
      });
    }

    // 3. OFFLINE FALLBACK: synchronous execution directly (as before)
    console.log('[FALLBACK] MongoDB disconnected. Processing analysis synchronously.');
    const cloneResult = await cloneRepository(repoUrl, targetBranch);
    tempPath = cloneResult.tempPath;
    const resolvedBranch = cloneResult.branch || 'main';

    const parseResult = await parseRepository(tempPath);

    // Read README.md if it exists for the overall overview
    let readmeContent = '';
    const readmePaths = ['README.md', 'readme.md', 'README.MD'];
    for (const rName of readmePaths) {
      const rPath = path.join(tempPath, rName);
      if (await fs.pathExists(rPath)) {
        readmeContent = await fs.readFile(rPath, 'utf-8');
        break;
      }
    }

    // 4. Run LangChain analysis for High-Level Overview
    console.log('Generating repository architectural overview...');
    const structureSummary = {
      totalFiles: parseResult.files.length,
      totalLinesOfCode: parseResult.totalLOC,
      languages: parseResult.languages,
      files: parseResult.files
    };
    const overviewSummary = await generateRepoOverview(name, structureSummary, readmeContent, userKeys);

    // 5. Generate individual file descriptions using LangChain
    console.log('Generating file descriptions...');
    const fileSummaries = await generateFileSummaries(parseResult.files, userKeys);

    // 6. Save/update Repository and FileNodes in Database/Cache
    let repoObj;
    let savedNodes;

    if (isDbConnected()) {
      repoObj = await Repository.findOne({ url: repoUrl, branch: resolvedBranch, userId: req.userId });
      if (!repoObj) {
        repoObj = new Repository({ url: repoUrl, owner, name, branch: resolvedBranch, userId: req.userId });
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

      // Clear old file nodes if refresh
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

      savedNodes = await FileNode.insertMany(nodesToSave);
    } else {
      // Offline fallback: write to local in-memory store
      console.log('[FALLBACK] MongoDB disconnected. Writing data to in-memory fallback.');
      const repoPayload = {
        owner,
        name,
        url: repoUrl,
        branch: resolvedBranch,
        totalFiles: parseResult.files.length,
        totalLinesOfCode: parseResult.totalLOC,
        languages: parseResult.languages,
        summary: overviewSummary,
        description: readmeContent ? readmeContent.substring(0, 500) : 'Public repository analysis'
      };
      repoObj = saveRepoFallback(repoPayload);
      savedNodes = saveFileNodesFallback(repoObj._id, parseResult.files.map(file => ({
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
      })));
    }

    // 8. Index in-memory Vector Store for chat RAG
    await indexRepositoryForChat(repoObj._id.toString(), savedNodes, userKeys);

    // 9. Respond
    return res.status(200).json({
      repository: repoObj,
      nodes: savedNodes
    });
  } catch (error) {
    console.error('Error during repository analysis:', error);
    if (isDbConnected()) {
      try {
        const u = await User.findById(req.userId);
        if (u) {
          u.credits += 1;
          await u.save();
          console.log(`Refunded 1 credit to user ${u.email} due to sync failure.`);
        }
      } catch (refundErr) {
        console.error('Failed to refund sync credit:', refundErr);
      }
    }
    return res.status(500).json({ error: error.message });
  } finally {
    // Clean up temporary files on disk
    if (tempPath) {
      await cleanupDirectory(tempPath);
    }
  }
};

/**
 * Controller to fetch all analyzed repositories list.
 * GET /api/repos
 */
export const getReposList = async (req, res) => {
  try {
    if (isDbConnected()) {
      const repos = await Repository.find({ userId: req.userId }).sort({ createdAt: -1 });
      return res.status(200).json(repos);
    } else {
      const repos = getReposListFallback();
      return res.status(200).json(repos);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRepoDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userKeys = {
      geminiKey: req.headers['x-gemini-key'],
      openaiKey: req.headers['x-openai-key'],
      anthropicKey: req.headers['x-anthropic-key'],
      provider: req.headers['x-llm-provider']
    };

    if (isDbConnected()) {
      const repo = await Repository.findOne({ _id: id, userId: req.userId });
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found or access denied.' });
      }
      const nodes = await FileNode.find({ repository: id });
      await indexRepositoryForChat(id, nodes, userKeys);
      return res.status(200).json({ repository: repo, nodes });
    } else {
      const repo = getRepoDetailsFallback(id);
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found in cache.' });
      }
      const nodes = getFileNodesFallback(id);
      await indexRepositoryForChat(id, nodes, userKeys);
      return res.status(200).json({ repository: repo, nodes });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Controller to fetch remote branches list for a repository.
 * GET /api/repos/:id/branches
 */
export const getRepoBranches = async (req, res) => {
  try {
    const { id } = req.params;
    let repoUrl = '';

    if (isDbConnected()) {
      const repo = await Repository.findOne({ _id: id, userId: req.userId });
      if (repo) repoUrl = repo.url;
    } else {
      const repo = getRepoDetailsFallback(id);
      if (repo) repoUrl = repo.url;
    }

    if (!repoUrl) {
      return res.status(404).json({ error: 'Repository not found.' });
    }

    const branches = await getRemoteBranches(repoUrl);
    return res.status(200).json(branches);
  } catch (error) {
    console.error('Error fetching repo branches:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Controller to fetch the progress status of a background job.
 * GET /api/jobs/:id
 */
export const getJobStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      return res.status(400).json({ error: 'Database is disconnected. Background jobs require MongoDB.' });
    }

    const job = await Job.findOne({ _id: id, userId: req.userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or access denied.' });
    }

    // If completed, fetch and return the repository and nodes data
    if (job.status === 'completed') {
      const repository = await Repository.findOne({ _id: job.repositoryId, userId: req.userId });
      const nodes = await FileNode.find({ repository: job.repositoryId });
      return res.status(200).json({
        status: 'completed',
        progress: job.progress,
        repository,
        nodes
      });
    }

    // Otherwise return current status and progress description
    return res.status(200).json({
      status: job.status,
      progress: job.progress,
      error: job.error
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return res.status(500).json({ error: error.message });
  }
};
