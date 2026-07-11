import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execPromise = promisify(exec);

/**
 * Parses a git public repository URL to extract owner and repository name.
 * Supports format: https://github.com/owner/repo or https://github.com/owner/repo.git
 * @param {string} gitUrl 
 * @returns {{owner: string, name: string}}
 */
export const parseGitUrl = (gitUrl) => {
  try {
    let cleanUrl = gitUrl.trim();
    if (cleanUrl.endsWith('.git')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 4);
    }
    
    // Split by slash and get owner/name
    const parts = cleanUrl.split('/');
    if (parts.length >= 2) {
      const name = parts[parts.length - 1];
      const owner = parts[parts.length - 2];
      return { owner, name };
    }
  } catch (err) {
    console.error('Error parsing Git URL:', err);
  }
  return { owner: 'unknown', name: 'repository' };
};

/**
 * Recursively counts files and sums sizes to verify repository scale constraints.
 * Excludes the .git folder.
 * @param {string} dirPath 
 * @param {number} maxFiles 
 * @param {number} maxSizeByte 
 */
export const checkRepositoryLimits = async (dirPath, maxFiles = 500, maxSizeByte = 50 * 1024 * 1024) => {
  let fileCount = 0;
  let totalSize = 0;

  const walk = async (currentPath) => {
    const files = await fs.readdir(currentPath);
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        if (file === '.git') continue;
        await walk(fullPath);
      } else {
        fileCount++;
        totalSize += stat.size;

        if (fileCount > maxFiles) {
          throw new Error(`Repository has too many files (maximum allowed is ${maxFiles}).`);
        }
        if (totalSize > maxSizeByte) {
          throw new Error(`Repository size is too large (maximum allowed is ${maxSizeByte / (1024 * 1024)}MB).`);
        }
      }
    }
  };

  await walk(dirPath);
  return { fileCount, totalSize };
};

/**
 * Shallow clones a public git repository into a temporary workspace.
 * Uses core.hooksPath=/dev/null to isolate security context.
 * @param {string} gitUrl 
 * @param {string} branch Optional branch to clone
 * @returns {Promise<{tempPath: string, owner: string, name: string, branch: string}>}
 */
export const cloneRepository = async (gitUrl, branch = '') => {
  const { owner, name } = parseGitUrl(gitUrl);
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tempPath = path.resolve(process.cwd(), 'temp', `${owner}_${name}_unique_${uniqueId}`);

  // Create temporary directory structure
  await fs.ensureDir(tempPath);

  try {
    console.log(`Cloning ${gitUrl} (branch: ${branch || 'default'}) into ${tempPath}...`);
    // git -c core.hooksPath=/dev/null clone --depth 1 for security and speed
    const branchFlag = branch ? `--branch ${branch} ` : '';
    await execPromise(`git -c core.hooksPath=/dev/null clone --depth 1 ${branchFlag}${gitUrl} "${tempPath}"`);
    console.log(`Successfully cloned ${gitUrl}. Checking limits...`);
    
    // Check repository constraints
    await checkRepositoryLimits(tempPath);

    // Resolve which branch was actually checked out
    let activeBranch = branch;
    if (!activeBranch) {
      try {
        const { stdout } = await execPromise(`git -C "${tempPath}" branch --show-current`);
        activeBranch = stdout.trim();
      } catch {
        try {
          const { stdout } = await execPromise(`git -C "${tempPath}" rev-parse --abbrev-ref HEAD`);
          activeBranch = stdout.trim();
        } catch {
          activeBranch = 'main';
        }
      }
    }
    
    return { tempPath, owner, name, branch: activeBranch };
  } catch (error) {
    // Clean up directory on failure
    await fs.remove(tempPath).catch(console.error);
    throw new Error(`Failed to clone git repository: ${error.message}`);
  }
};

/**
 * Fetches the list of remote branches for a git repository URL.
 * @param {string} gitUrl
 * @returns {Promise<Array<string>>}
 */
export const getRemoteBranches = async (gitUrl) => {
  try {
    console.log(`Fetching remote branches for ${gitUrl}...`);
    const { stdout } = await execPromise(`git ls-remote --heads ${gitUrl}`);
    const branches = [];
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const ref = parts[1];
          if (ref.startsWith('refs/heads/')) {
            branches.push(ref.replace('refs/heads/', ''));
          }
        }
      }
    }
    return branches.length > 0 ? branches : ['main'];
  } catch (error) {
    console.error(`Failed to fetch remote branches for ${gitUrl}:`, error);
    return ['main'];
  }
};

/**
 * Cleans up a temporary directory.
 * @param {string} directoryPath 
 */
export const cleanupDirectory = async (directoryPath) => {
  try {
    if (directoryPath && directoryPath.includes('temp')) {
      await fs.remove(directoryPath);
      console.log(`Cleaned up temp directory: ${directoryPath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up directory ${directoryPath}:`, error);
  }
};
