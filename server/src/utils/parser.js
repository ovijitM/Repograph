import fs from 'fs-extra';
import path from 'path';

// List of directories and file types to ignore during repository walking
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.github', '.vscode', 'build', 'dist', 
  'out', 'coverage', 'temp', 'venv', '.next', '.nuxt', 'bower_components'
]);

const IGNORE_FILES = new Set([
  '.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'package.json', 'tsconfig.json', '.gitignore', '.eslintrc.json',
  '.prettierrc', 'README.md', 'LICENSE'
]);

const BINARY_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot',
  // Archives
  '.zip', '.tar', '.gz', '.rar',
  // Documents
  '.pdf', '.epub',
  // DB/Cache
  '.sqlite', '.db',
  // Executables
  '.exe', '.dll', '.so', '.dylib'
]);

/**
 * Gets language name based on file extension.
 * @param {string} ext 
 * @returns {string}
 */
const getLanguageFromExtension = (ext) => {
  const mapping = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (JSX)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)',
    '.py': 'Python',
    '.go': 'Go',
    '.rs': 'Rust',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C/C++ Header',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.sh': 'Shell Script',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.graphql': 'GraphQL',
    '.sql': 'SQL'
  };
  return mapping[ext.toLowerCase()] || 'Other';
};

/**
 * Extract imports from file content based on language/extension.
 * @param {string} content 
 * @param {string} ext 
 * @returns {string[]} Raw import strings
 */
const extractRawImports = (content, ext) => {
  const imports = [];
  const lowercaseExt = ext.toLowerCase();

  if (['.js', '.jsx', '.ts', '.tsx'].includes(lowercaseExt)) {
    // ES Modules imports: import x from 'y', import 'y', import { x } from 'y'
    const esmRegex = /(?:import\s+[\s\S]*?\s+from\s+|import\s+)['"]([^'"]+)['"]/g;
    // CommonJS requires: require('y')
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    // Dynamic imports: import('y')
    const dynamicRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = esmRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = cjsRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = dynamicRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (lowercaseExt === '.py') {
    // Python imports: import x, from y import z
    const importRegex = /^\s*import\s+([a-zA-Z0-9_\.,\s]+)/gm;
    const fromImportRegex = /^\s*from\s+([a-zA-Z0-9_\.]+)\s+import/gm;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      // Split imports like "import os, sys"
      const modules = match[1].split(',').map(m => m.trim());
      imports.push(...modules);
    }
    while ((match = fromImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return [...new Set(imports)];
};

/**
 * Resolves a raw import path relative to the importing file's directory.
 * @param {string} importingFilePath Relative path of importing file (e.g. "src/index.js")
 * @param {string} rawImport The raw import string (e.g. "./components/Card")
 * @param {Set<string>} allFilesSet Set of all file paths relative to repo root
 * @returns {string|null} Resolved file path relative to repo root, or null if external
 */
const resolveImportPath = (importingFilePath, rawImport, allFilesSet) => {
  if (!rawImport) return null;

  // 1. If it's a relative import (starts with . or ..)
  if (rawImport.startsWith('.')) {
    const importingDir = path.dirname(importingFilePath);
    const resolvedRaw = path.join(importingDir, rawImport);
    const normalizedPath = resolvedRaw.replace(/\\/g, '/');

    const extensionsToTry = ['', '.js', '.jsx', '.ts', '.tsx', '.py', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
    for (const ext of extensionsToTry) {
      const candidate = `${normalizedPath}${ext}`;
      const cleanCandidate = path.normalize(candidate).replace(/\\/g, '/');
      if (allFilesSet.has(cleanCandidate)) {
        return cleanCandidate;
      }
    }
    return null;
  }

  // 2. If it's an absolute import or alias import (does not start with dot)
  let normalizedImport = rawImport;
  const isPython = importingFilePath.endsWith('.py');

  if (isPython) {
    // Python imports use dots instead of slashes, e.g. "src.agents.math_agent"
    normalizedImport = rawImport.replace(/\./g, '/');
  } else {
    // JS/TS: strip common aliases like @/
    if (normalizedImport.startsWith('@/')) {
      normalizedImport = normalizedImport.substring(2);
    }
  }

  const extensionsToTry = ['', '.js', '.jsx', '.ts', '.tsx', '.py', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
  for (const ext of extensionsToTry) {
    const candidate = `${normalizedImport}${ext}`;
    
    // Direct match (if the import specifies the full absolute path from root)
    if (allFilesSet.has(candidate)) {
      return candidate;
    }
    
    // Suffix match (e.g. if import is "components/Button" and path in repo is "client/src/components/Button.jsx")
    const suffix = candidate.startsWith('/') ? candidate : `/${candidate}`;
    for (const filePath of allFilesSet) {
      if (filePath.endsWith(suffix)) {
        return filePath;
      }
    }
  }

  return null;
};

/**
 * Parse file content to extract basic exports.
 * Simple regex analyzer for functions/classes/const exports in JS/TS.
 * @param {string} content 
 * @param {string} ext 
 * @returns {string[]}
 */
const extractExports = (content, ext) => {
  const exportsList = [];
  const lowercaseExt = ext.toLowerCase();

  if (['.js', '.jsx', '.ts', '.tsx'].includes(lowercaseExt)) {
    // Matches: export const foo, export function bar, export class Baz, export default
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function\*?|class|interface|type)\s+([a-zA-Z0-9_]+)/g;
    const defaultExportRegex = /export\s+default\s+([a-zA-Z0-9_]+)/g;
    const namedExportsRegex = /export\s+\{([^}]+)\}/g;

    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) exportsList.push(match[1]);
    }
    
    // Check default exports
    while ((match = defaultExportRegex.exec(content)) !== null) {
      if (match[1] && !exportsList.includes(match[1])) {
        exportsList.push(`${match[1]} (default)`);
      }
    }
    
    // Check named block exports: export { a, b as c }
    while ((match = namedExportsRegex.exec(content)) !== null) {
      if (match[1]) {
        const names = match[1].split(',').map(n => {
          const parts = n.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        });
        exportsList.push(...names.filter(Boolean));
      }
    }
  } else if (lowercaseExt === '.py') {
    // Matches top-level function/class definitions
    const pythonRegex = /^\s*(?:def|class)\s+([a-zA-Z0-9_]+)/gm;
    let match;
    while ((match = pythonRegex.exec(content)) !== null) {
      exportsList.push(match[1]);
    }
  }

  return [...new Set(exportsList)].slice(0, 15); // limit to 15 items to keep it clean
};

/**
 * Walk directory recursively and compile file meta information.
 * @param {string} rootPath Absolute path to local cloned repo
 * @returns {Promise<{files: Array, totalLOC: number, languages: Object}>}
 */
export const parseRepository = async (rootPath) => {
  const filesList = [];
  const allFilesSet = new Set();
  let totalLOC = 0;
  const languagesCount = {};

  // Phase 1: Walk the tree and collect all valid files
  const walk = async (currentPath) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryName = entry.name;
      const fullPath = path.join(currentPath, entryName);
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entryName)) {
          await walk(fullPath);
        }
      } else {
        const ext = path.extname(entryName);
        if (!IGNORE_FILES.has(entryName) && !BINARY_EXTENSIONS.has(ext)) {
          allFilesSet.add(relativePath);
        }
      }
    }
  };

  await walk(rootPath);

  // Phase 2: Process files to extract contents, lines of code, imports, exports
  for (const relativePath of allFilesSet) {
    const fullPath = path.join(rootPath, relativePath);
    const stats = await fs.stat(fullPath);
    const ext = path.extname(relativePath);
    const language = getLanguageFromExtension(ext);

    let content = '';
    let linesCount = 0;
    let rawImports = [];
    let exportsList = [];

    try {
      // Read the file (limit size to 500KB to avoid memory issues)
      if (stats.size < 500000) {
        content = await fs.readFile(fullPath, 'utf-8');
        linesCount = content.split('\n').length;
        totalLOC += linesCount;
        
        // Track language metrics
        languagesCount[language] = (languagesCount[language] || 0) + linesCount;

        // Extract raw imports/exports
        rawImports = extractRawImports(content, ext);
        exportsList = extractExports(content, ext);
      }
    } catch (err) {
      console.error(`Error reading file ${relativePath}:`, err);
    }

    // Capture first 150 lines as snippet for UI / RAG
    const codeSnippet = content
      .split('\n')
      .slice(0, 150)
      .join('\n');

    filesList.push({
      path: relativePath,
      name: path.basename(relativePath),
      type: 'file',
      size: stats.size,
      language,
      linesOfCode: linesCount,
      rawImports, // temporarily hold raw imports to resolve them in Phase 3
      exports: exportsList,
      codeSnippet,
      parentPath: path.dirname(relativePath).replace(/\\/g, '/')
    });
  }

  // Phase 3: Resolve raw imports to exact target files in our codebase
  for (const file of filesList) {
    const resolvedImports = [];
    for (const rawImp of file.rawImports) {
      const resolved = resolveImportPath(file.path, rawImp, allFilesSet);
      if (resolved) {
        resolvedImports.push(resolved);
      }
    }
    file.imports = resolvedImports;
    delete file.rawImports; // clean up rawImports
  }

  // Calculate languages percentage
  const totalWeight = Object.values(languagesCount).reduce((a, b) => a + b, 0);
  const languagesPercentage = {};
  for (const [lang, loc] of Object.entries(languagesCount)) {
    languagesPercentage[lang] = totalWeight > 0 ? Math.round((loc / totalWeight) * 100) : 0;
  }

  return {
    files: filesList,
    totalLOC,
    languages: languagesPercentage
  };
};
