import mongoose from 'mongoose';

const FileNodeSchema = new mongoose.Schema({
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['file', 'directory'],
    required: true,
  },
  size: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
    default: '',
  },
  linesOfCode: {
    type: Number,
    default: 0,
  },
  imports: {
    type: [String], // Array of resolved relative paths or external packages imported
    default: [],
  },
  exports: {
    type: [String], // List of key exports (e.g. functions, components, variables)
    default: [],
  },
  summary: {
    type: String,
    default: '',
  },
  codeSnippet: {
    type: String,
    default: '', // First 100-200 lines or important lines of the file for quick viewing/context RAG
  },
  parentPath: {
    type: String,
    default: '',
  },
});

// Compound index for quick lookup within a repository
FileNodeSchema.index({ repository: 1, path: 1 }, { unique: true });

export default mongoose.model('FileNode', FileNodeSchema);
