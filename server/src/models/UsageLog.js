import mongoose from 'mongoose';

const UsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['analyze', 'chat'],
    required: true,
  },
  creditsDeducted: {
    type: Number,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('UsageLog', UsageLogSchema);
