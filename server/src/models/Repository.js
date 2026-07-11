import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    default: 'main',
  },
  description: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  languages: {
    type: Map,
    of: Number,
    default: {},
  },
  totalFiles: {
    type: Number,
    default: 0,
  },
  totalLinesOfCode: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

RepositorySchema.index({ url: 1, branch: 1, userId: 1 }, { unique: true });

export default mongoose.model('Repository', RepositorySchema);
