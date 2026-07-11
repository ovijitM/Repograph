import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  gitUrl: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    default: 'main',
  },
  forceRefresh: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  progress: {
    type: String,
    default: 'Queued...',
  },
  error: {
    type: String,
    default: '',
  },
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    default: null,
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

JobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', JobSchema);
