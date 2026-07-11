import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  pack: {
    type: String,
    required: true,
  },
  stripeSessionId: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Payment', PaymentSchema);
