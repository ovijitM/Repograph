import mongoose from 'mongoose';

// In-memory cache stores
const reposCache = new Map(); // Keys: repo URL and repo ID, Values: repo object
const fileNodesCache = new Map(); // Key: repo ID (string), Value: Array of FileNode objects

/**
 * Checks if the MongoDB database connection is active.
 * @returns {boolean}
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Lists all repositories in-memory.
 */
export const getReposListFallback = () => {
  console.log('[FALLBACK] Reading repository list from in-memory cache.');
  // Filter out duplicates (since we map by URL and ID)
  const uniqueRepos = [];
  const seenIds = new Set();
  
  for (const repo of reposCache.values()) {
    if (!seenIds.has(repo._id.toString())) {
      seenIds.add(repo._id.toString());
      uniqueRepos.push(repo);
    }
  }
  return uniqueRepos.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Gets details of a single repo in-memory.
 */
export const getRepoDetailsFallback = (id) => {
  console.log(`[FALLBACK] Reading repository details for ID ${id} from in-memory cache.`);
  return reposCache.get(id) || null;
};

/**
 * Gets all file nodes for a repo in-memory.
 */
export const getFileNodesFallback = (repoId) => {
  console.log(`[FALLBACK] Reading file nodes for repo ${repoId} from in-memory cache.`);
  return fileNodesCache.get(repoId.toString()) || [];
};

/**
 * Finds a repo by its Git URL and branch in-memory.
 */
export const findRepoByUrlFallback = (url, branch = 'main') => {
  console.log(`[FALLBACK] Querying repo URL "${url}" branch "${branch}" from in-memory cache.`);
  return reposCache.get(`${url}#${branch}`) || null;
};

/**
 * Saves/updates a repository record in-memory.
 */
export const saveRepoFallback = (repoData) => {
  const branch = repoData.branch || 'main';
  console.log(`[FALLBACK] Saving repository "${repoData.name}" (branch: ${branch}) into in-memory cache.`);
  
  const id = repoData._id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  const record = {
    _id: id,
    owner: repoData.owner,
    name: repoData.name,
    url: repoData.url,
    branch: branch,
    description: repoData.description,
    summary: repoData.summary,
    languages: repoData.languages || {},
    totalFiles: repoData.totalFiles || 0,
    totalLinesOfCode: repoData.totalLinesOfCode || 0,
    createdAt: repoData.createdAt || new Date(),
    updatedAt: new Date()
  };

  // Map by both URL and generated ID for quick retrieval
  reposCache.set(id.toString(), record);
  reposCache.set(`${repoData.url}#${branch}`, record);
  
  return record;
};

/**
 * Saves file nodes list in-memory.
 */
export const saveFileNodesFallback = (repoId, fileNodes) => {
  console.log(`[FALLBACK] Writing ${fileNodes.length} file nodes for repo ID ${repoId} into in-memory cache.`);
  
  const records = fileNodes.map((fn, idx) => ({
    _id: fn._id || `mem_fn_${repoId}_${idx}_${Date.now()}`,
    repository: repoId,
    path: fn.path,
    name: fn.name,
    type: fn.type,
    size: fn.size || 0,
    language: fn.language || '',
    linesOfCode: fn.linesOfCode || 0,
    imports: fn.imports || [],
    exports: fn.exports || [],
    summary: fn.summary || '',
    codeSnippet: fn.codeSnippet || '',
    parentPath: fn.parentPath || ''
  }));

  fileNodesCache.set(repoId.toString(), records);
  return records;
};
