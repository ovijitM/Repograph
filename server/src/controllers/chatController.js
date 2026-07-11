import FileNode from '../models/FileNode.js';
import Repository from '../models/Repository.js';
import { queryRepositoryChat } from '../utils/langchainHelper.js';
import { isDbConnected, getFileNodesFallback } from '../utils/dbFallback.js';

/**
 * Controller to handle conversational queries about the repository.
 * POST /api/repos/:id/chat
 */
export const chatRepo = async (req, res) => {
  const { id } = req.params;
  const { question, chatHistory } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question string is required.' });
  }

  try {
    const userKeys = {
      geminiKey: req.headers['x-gemini-key'],
      openaiKey: req.headers['x-openai-key'],
      provider: req.headers['x-llm-provider']
    };

    // Retrieve file nodes to support keyword scanner in mock fallback mode
    let fileNodes;
    if (isDbConnected()) {
      const repo = await Repository.findOne({ _id: id, userId: req.userId });
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found or access denied.' });
      }
      fileNodes = await FileNode.find({ repository: id });
    } else {
      fileNodes = getFileNodesFallback(id);
    }
    
    // Perform RAG query or Keyword lookup
    const answer = await queryRepositoryChat(id, fileNodes, question, chatHistory || [], userKeys);

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in chat controller:', error);
    return res.status(500).json({ error: error.message });
  }
};
