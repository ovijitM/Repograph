import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import mongoose from 'mongoose';
import FileNode from '../models/FileNode.js';

// In-memory cache to store active vector stores for each repository ID
// Key: repoId (string), Value: MemoryVectorStore instance
const vectorStoreCache = new Map();

/**
 * Custom wrapper for Fallback Chat Model.
 * Attempts execution with a primary model (Gemini) first, and falls back to a fallback model (Claude) on failure.
 */
class FallbackChatModel {
  constructor(primaryModel, fallbackModel) {
    this.primaryModel = primaryModel;
    this.fallbackModel = fallbackModel;
  }

  async invoke(input, options) {
    if (!this.primaryModel) {
      if (this.fallbackModel) {
        console.log("No primary model initialized. Using fallback Chat model (Claude)...");
        return await this.fallbackModel.invoke(input, options);
      }
      throw new Error("No Chat model initialized.");
    }

    try {
      return await this.primaryModel.invoke(input, options);
    } catch (err) {
      if (this.fallbackModel) {
        console.warn(`Primary Chat model (Gemini) failed: ${err.message}. Falling back to Claude...`);
        return await this.fallbackModel.invoke(input, options);
      }
      throw err;
    }
  }
}

/**
 * Filters out placeholder strings from environment config,
 * returning null if the key is a template default.
 */
const cleanKey = (key) => {
  if (!key) return null;
  const k = key.trim();
  const lower = k.toLowerCase();
  if (lower.includes('your_') || lower.includes('key_here') || lower.includes('placeholder')) {
    return null;
  }
  return k;
};

/**
 * Checks if LLM API Keys are configured in the environment or passed by user.
 * @param {object} userKeys Optional custom API keys from client
 * @returns {{hasKey: boolean, provider: string, key: string}}
 */
const getLLMConfig = (userKeys) => {
  const provider = (userKeys && userKeys.provider) || process.env.LLM_PROVIDER || 'anthropic';
  let hasKey = false;
  let key = null;

  if (provider === 'google') {
    key = cleanKey((userKeys && userKeys.geminiKey) || process.env.GEMINI_API_KEY);
    if (key) hasKey = true;
  } else if (provider === 'openai') {
    key = cleanKey((userKeys && userKeys.openaiKey) || process.env.OPENAI_API_KEY);
    if (key) hasKey = true;
  } else if (provider === 'anthropic') {
    key = cleanKey((userKeys && userKeys.anthropicKey) || process.env.ANTHROPIC_API_KEY);
    if (key) hasKey = true;
  }

  return { hasKey, provider, key };
};

/**
 * Initializes the Chat LLM model.
 * @param {object} userKeys Optional custom API keys from client
 */
const initChatModel = (userKeys) => {
  const provider = (userKeys && userKeys.provider) || process.env.LLM_PROVIDER || 'anthropic';

  try {
    if (provider === 'openai') {
      const key = cleanKey((userKeys && userKeys.openaiKey) || process.env.OPENAI_API_KEY);
      if (!key) return null;
      return new ChatOpenAI({
        openAIApiKey: key,
        modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
      });
    } else if (provider === 'google') {
      const key = cleanKey((userKeys && userKeys.geminiKey) || process.env.GEMINI_API_KEY);
      if (!key) return null;
      return new ChatGoogleGenerativeAI({
        apiKey: key,
        modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        temperature: 0.2,
      });
    } else {
      // provider === 'anthropic' (default)
      const primaryKey = cleanKey((userKeys && userKeys.anthropicKey) || process.env.ANTHROPIC_API_KEY);
      const primaryModel = primaryKey ? new ChatAnthropic({
        apiKey: primaryKey,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        temperature: 0.2,
      }) : null;

      const geminiKey = cleanKey((userKeys && userKeys.geminiKey) || process.env.GEMINI_API_KEY);
      const fallbackModel = geminiKey ? new ChatGoogleGenerativeAI({
        apiKey: geminiKey,
        modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        temperature: 0.2,
      }) : null;

      if (!primaryModel && !fallbackModel) return null;
      return new FallbackChatModel(primaryModel, fallbackModel);
    }
  } catch (err) {
    console.error('Failed to initialize Chat model:', err);
    return null;
  }
};

/**
 * Initializes the Embeddings model.
 * Decoupled from Chat LLM provider — uses Gemini (first choice) or OpenAI keys if available.
 * @param {object} userKeys Optional custom API keys from client
 */
const initEmbeddings = (userKeys) => {
  try {
    const geminiKey = cleanKey((userKeys && userKeys.geminiKey) || process.env.GEMINI_API_KEY);
    if (geminiKey) {
      return new GoogleGenerativeAIEmbeddings({
        apiKey: geminiKey,
        model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
      });
    }

    const openaiKey = cleanKey((userKeys && userKeys.openaiKey) || process.env.OPENAI_API_KEY);
    if (openaiKey) {
      return new OpenAIEmbeddings({
        openAIApiKey: openaiKey,
        modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      });
    }

    return null;
  } catch (err) {
    console.error('Failed to initialize Embeddings model:', err);
    return null;
  }
};

/**
 * Generate a high-level summary/overview of the repository.
 * Fallbacks to a mock generator if API key is not present.
 * @param {string} repoName 
 * @param {object} structure Summary of structure, LOC, file list
 * @param {string} readmeContent Raw text of README.md if it exists
 * @returns {Promise<string>}
 */
export const generateRepoOverview = async (repoName, structure, readmeContent = '', userKeys = null) => {
  const model = initChatModel(userKeys);

  const prompt = `You are a Senior Software Architect. Analyze the following information about a Git repository named "${repoName}".
  
Languages and statistics:
${JSON.stringify(structure.languages, null, 2)}
Total lines of code: ${structure.totalLinesOfCode}
Total files count: ${structure.totalFiles}

Files directory summary (first 50 files):
${structure.files.slice(0, 50).map(f => `- ${f.path} (${f.language})`).join('\n')}

README Content (First 1500 chars):
${readmeContent ? readmeContent.substring(0, 1500) : 'No README file found.'}

Task: Write a high-level technical overview of this repository. Summarize:
1. What the project does (based on README/files).
2. The core architectural stack and patterns detected.
3. Key file entries or directories to look at.
4. Draw a visual project architecture/flow diagram at the bottom of your answer inside a \`\`\`mermaid code block.
   CRITICAL MERMAID RULES (follow all of these exactly or the diagram will fail to render):
   1. Enclose all node labels with special characters, spaces, brackets, or paths in double quotes. Example: AuthRoute["/api/auth"] or Node["Name (Extra Info)"].
   2. Never put brackets [ ], parentheses ( ), or special characters INSIDE pipe edge-labels. Pipe labels must be plain short words only. BAD: A -->|"Events[async"]| B. GOOD: A -->|Events| B.
   3. Do NOT use <--> bidirectional arrows with pipe labels. Use separate directed arrows instead.
   4. Keep edge labels very short (1-3 words, no brackets, no quotes, no special chars).
Keep it structured, clean, and concise (under 300 words total).`;

  if (!model) {
    // Graceful Mock fallback
    return `### [DEMO MODE] ${repoName} Architectural Overview
This overview is generated in demo mode (no API key configured).

* **Project Scope**: A project named **${repoName}** containing **${structure.totalFiles}** source files with a total volume of **${structure.totalLinesOfCode}** lines of code.
* **Tech Stack**: Detected languages: ${Object.keys(structure.languages).join(', ') || 'N/A'}. 
* **Key Components**:
  - The entry point appears to be located around: \`${structure.files.find(f => f.name.includes('index') || f.name.includes('main') || f.name.includes('app'))?.path || 'root'}\`.
  - Directory structure covers components like: ${[...new Set(structure.files.map(f => f.parentPath).filter(Boolean))].slice(0, 5).map(p => `\`${p}\``).join(', ')}.

*Note: Configure a \`GEMINI_API_KEY\` or \`OPENAI_API_KEY\` in the backend server's \`.env\` file to enable live LangChain-powered code analysis.*

\`\`\`mermaid
graph TD
    Client[Client Frontend] -->|API Requests| Server[Server Backend]
    Server -->|RAG / VectorStore| DB[(Memory Cache / MongoDB)]
    Client -->|WebSocket / Events| Server
\`\`\``;
  }

  try {
    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error('Error generating repository overview:', error);
    return `Error generating overview using AI: ${error.message}`;
  }
};

/**
 * Generates brief summaries for a batch of files.
 * Optimized to do single/few calls or standard template fallback.
 * @param {Array} files 
 * @returns {Promise<Object>} Map of filePath -> summary
 */
export const generateFileSummaries = async (files, userKeys = null) => {
  const model = initChatModel(userKeys);
  const summaries = {};

  if (!model) {
    // Generate intelligent template-based summaries in mock mode
    files.forEach(file => {
      if (file.name.toLowerCase() === 'package.json') {
        summaries[file.path] = 'Defines npm packages, metadata, scripts, and dependencies for the project.';
      } else if (file.name.toLowerCase() === 'readme.md') {
        summaries[file.path] = 'Main markdown documentation explaining the project setup, run instructions, and highlights.';
      } else if (file.path.includes('routes/')) {
        summaries[file.path] = `API Route router file mapping URLs to controller functions for handling HTTP requests.`;
      } else if (file.path.includes('controllers/')) {
        summaries[file.path] = `Request controllers managing logic, fetching data, and processing responses.`;
      } else if (file.path.includes('models/')) {
        summaries[file.path] = `Database schema declarations defining structural layouts and constraints.`;
      } else {
        summaries[file.path] = `Source code file written in ${file.language || 'text'} (${file.linesOfCode} lines, exports: ${file.exports.join(', ') || 'none'}).`;
      }
    });
    return summaries;
  }

  try {
    // To avoid hitting rate limits or spending excessive tokens, we will summarize
    // files in batches of 10.
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const chunk = files.slice(i, i + batchSize);

      const fileDataList = chunk.map(f => ({
        path: f.path,
        language: f.language,
        exports: f.exports,
        snippetHeader: f.codeSnippet ? f.codeSnippet.substring(0, 300) : ''
      }));

      const prompt = `You are a code understanding tool. Give a ONE-SENTENCE, very concise description of the purpose of each of the following files based on their path, language, exports, and top code snippet.
      
Files to summarize:
${JSON.stringify(fileDataList, null, 2)}

Respond ONLY with a JSON object mapping file paths to their one-sentence summary.
Example:
{
  "src/utils/math.js": "Helper utility providing mathematical formulas and statistical functions."
}`;

      const response = await model.invoke(prompt);

      // Parse JSON from LLM output
      let contentText = response.content.trim();
      // Strip markdown JSON block backticks if present
      if (contentText.startsWith('```')) {
        contentText = contentText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(contentText);
        Object.assign(summaries, parsed);
      } catch (parseErr) {
        console.error('Failed to parse file summaries batch:', parseErr);
        // Fallback for this batch
        chunk.forEach(f => {
          summaries[f.path] = `Code file managing ${f.language} logic in the codebase.`;
        });
      }
    }

    // Ensure all files have a summary
    files.forEach(f => {
      if (!summaries[f.path]) {
        summaries[f.path] = `Source code file containing project logic.`;
      }
    });

    return summaries;
  } catch (error) {
    console.error('Error generating file summaries:', error);
    // Return empty or templates
    files.forEach(f => {
      summaries[f.path] = `Source code file in ${f.language}.`;
    });
    return summaries;
  }
};

// Helper to format keyword-matched file nodes as context for the LLM
const getKeywordContext = (fileNodes, question) => {
  const terms = question.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const matches = [];

  for (const node of fileNodes) {
    if (node.type !== 'file') continue;

    let score = 0;
    const exportsList = Array.isArray(node.exports) ? node.exports : [];
    const textToSearch = `${node.path} ${node.name} ${node.language} ${exportsList.join(' ')} ${node.summary} ${node.codeSnippet}`.toLowerCase();

    for (const term of terms) {
      if (textToSearch.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      matches.push({ node, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 4); // Take top 4 files

  if (topMatches.length === 0) return '';

  return topMatches.map(m => {
    const node = m.node;
    const exportsList = Array.isArray(node.exports) ? node.exports : [];
    const nodeText = `File Path: ${node.path}\nLanguage: ${node.language}\nExports: ${exportsList.join(', ')}\nFile AI Summary: ${node.summary || ''}\nCode Content:\n${node.codeSnippet}`;
    return `--- START FILE: ${node.path} ---\n${nodeText}\n--- END FILE ---`;
  }).join('\n\n');
};

// Helper for local keyword search fallback if Vector Search is not active or still building
const runKeywordFallback = (fileNodes, question) => {
  const terms = question.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const matches = [];

  for (const node of fileNodes) {
    if (node.type !== 'file') continue;

    let score = 0;
    const exportsList = Array.isArray(node.exports) ? node.exports : [];
    const textToSearch = `${node.path} ${node.name} ${node.language} ${exportsList.join(' ')} ${node.summary} ${node.codeSnippet}`.toLowerCase();

    for (const term of terms) {
      if (textToSearch.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      matches.push({ node, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 3);

  const matchInfo = topMatches.map(m =>
    `- **[${m.node.path}](file://${m.node.path})** (${m.node.language}): ${m.node.summary || 'No summary available'}`
  ).join('\n');

  return `### [DEMO MODE] Codebase Chatbot
*This answer is generated in demo mode because no AI API Keys are configured on the server.*

Based on a keyword scan of the repository files, here are the most relevant files matching your question:
${matchInfo || '_No directly matching files found._'}

**Prompt Query received**: "${question}"

To enable semantic search and conversational responses, make sure that:
1. You have successfully configured a MongoDB Atlas Vector Search Index named **"repograph"** on the \`test.filenodes\` collection.
2. A valid \`GEMINI_API_KEY\` or \`OPENAI_API_KEY\` is configured in your \`server/.env\` file.`;
};

/**
 * Initializes and indexes a RAG Vector Store for the repository files.
 * @param {string} repoId 
 * @param {Array} fileNodes 
 */
export const indexRepositoryForChat = async (repoId, fileNodes, userKeys = null) => {
  const embeddings = initEmbeddings(userKeys);
  if (!embeddings) {
    console.log(`Skipping vector indexing for ${repoId} - No Embeddings API Key found.`);
    return;
  }

  try {
    // Only generate embeddings for files that do not have them calculated yet
    const pendingNodes = fileNodes.filter(
      node => node.type === 'file' && node.codeSnippet && (!node.embedding || node.embedding.length === 0)
    );

    if (pendingNodes.length === 0) {
      console.log(`Vector index for repository ${repoId} is already up to date.`);
      return;
    }

    console.log(`Generating embeddings for ${pendingNodes.length} pending files in repo ${repoId}...`);

    // Process in batches of 15 to avoid rate-limiting or payload issues
    const batchSize = 15;
    for (let i = 0; i < pendingNodes.length; i += batchSize) {
      const chunk = pendingNodes.slice(i, i + batchSize);
      
      const textsToEmbed = chunk.map(node => {
        const exportsList = Array.isArray(node.exports) ? node.exports : [];
        return `File Path: ${node.path}\nLanguage: ${node.language}\nExports: ${exportsList.join(', ')}\nFile AI Summary: ${node.summary || ''}\nCode Content:\n${node.codeSnippet}`;
      });

      const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);

      const bulkOps = chunk.map((node, index) => ({
        updateOne: {
          filter: { _id: node._id },
          update: { $set: { embedding: embeddingVectors[index] } }
        }
      }));

      if (chunk.length > 0 && mongoose.connection.readyState === 1) {
        await Promise.all(chunk.map((node, index) => 
          FileNode.updateOne(
            { _id: node._id },
            { $set: { embedding: embeddingVectors[index] } }
          )
        ));
      } else if (chunk.length > 0) {
        // In offline fallback, store vectors in-memory on the node objects directly
        chunk.forEach((node, index) => {
          node.embedding = embeddingVectors[index];
        });
      }
    }

    console.log(`Successfully generated and saved vector embeddings for repository ${repoId}`);
  } catch (error) {
    console.error(`Error indexing repository ${repoId} into MongoDB Vector Search:`, error);
  }
};

/**
 * Queries the repository database using RAG.
 * Fallbacks to keyword search + mock response if no API keys or search index fails.
 * @param {string} repoId 
 * @param {Array} fileNodes List of file nodes from DB to search if in demo mode
 * @param {string} question 
 * @param {Array} chatHistory List of { role: 'user'|'assistant', content: string }
 * @returns {Promise<string>}
 */
export const queryRepositoryChat = async (repoId, fileNodes, question, chatHistory = [], userKeys = null) => {
  const model = initChatModel(userKeys);
  const embeddings = initEmbeddings(userKeys);

  if (!model) {
    return runKeywordFallback(fileNodes, question);
  }

  let context = '';
  let usingFallback = false;

  // Try Vector search if embeddings key is configured
  if (embeddings) {
    try {
      const queryEmbedding = await embeddings.embedQuery(question);

      // Perform MongoDB Atlas Vector Search using aggregation pipeline
      let searchResults = [];
      try {
        searchResults = await FileNode.aggregate([
          {
            $vectorSearch: {
              index: "repograph",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: 4,
              filter: {
                repository: new mongoose.Types.ObjectId(repoId)
              }
            }
          }
        ]);
      } catch (dbErr) {
        console.warn("Atlas Vector Search failed, falling back to database keyword search:", dbErr.message);
        usingFallback = true;
      }

      if (searchResults && searchResults.length > 0) {
        context = searchResults.map(node => {
          const exportsList = Array.isArray(node.exports) ? node.exports : [];
          const nodeText = `File Path: ${node.path}\nLanguage: ${node.language}\nExports: ${exportsList.join(', ')}\nFile AI Summary: ${node.summary || ''}\nCode Content:\n${node.codeSnippet}`;
          return `--- START FILE: ${node.path} ---\n${nodeText}\n--- END FILE ---`;
        }).join('\n\n');
      }
    } catch (embedErr) {
      console.warn("Failed to generate query embeddings, falling back to keyword search context:", embedErr.message);
      usingFallback = true;
    }
  } else {
    usingFallback = true;
  }

  // If Vector Search yielded no context, extract keyword-matching context files
  if (!context) {
    context = getKeywordContext(fileNodes, question);
    usingFallback = true;
  }

  try {
    const historyPrompt = chatHistory.length > 0
      ? `Conversation History:\n${chatHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')}\n`
      : '';

    const prompt = `You are an expert AI software developer assistant. You are answering questions about a codebase.
Use the following retrieved file segments as context to answer the user's question. If you don't know the answer or if the context doesn't contain information to answer it, make a reasonable guess based on coding knowledge but clearly state it is an estimate.

Retrieved Context Files:
${context || 'No relevant code files could be retrieved for context.'}

${historyPrompt}
User Question: ${question}

Provide a detailed, helpful markdown answer. Cite which files contain the relevant code.
If explaining architectural structure, data flow, component hierarchy, or call sequences, please use a Mermaid diagram (rendered in a \`\`\`mermaid code block) instead of drawing ASCII art.
CRITICAL MERMAID RULES (follow all of these exactly or the diagram will fail to render):
1. Enclose all node labels with special characters, spaces, brackets, or paths in double quotes. Example: AuthRoute["/api/auth"] or Node["Name (Extra Info)"].
2. Never put brackets [ ], parentheses ( ), or special characters INSIDE pipe edge-labels. Pipe labels must be plain short words only. BAD: A -->|"Events[async"]| B. GOOD: A -->|Events| B.
3. Do NOT use <--> bidirectional arrows with pipe labels. Use separate directed arrows instead.
4. Keep edge labels very short (1-3 words, no brackets, no quotes, no special chars).`;

    const response = await model.invoke(prompt);
    let answer = response.content;

    if (usingFallback) {
      answer = `*Note: Answer generated using keyword file matching (Vector search index is not yet fully configured or building).* \n\n${answer}`;
    }

    return answer;
  } catch (error) {
    console.error('Error in codebase RAG query:', error);
    return `Error retrieving answer: ${error.message}`;
  }
};
