import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/repograph';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop stale unique index 'url_1' if it exists to allow multi-branch indexing
    try {
      await conn.connection.db.collection('repositories').dropIndex('url_1');
      console.log('Successfully dropped legacy unique "url_1" index from repositories.');
    } catch (err) {
      // Ignore if index doesn't exist (e.g. fresh DB or already dropped)
      if (err.codeName !== 'IndexNotFound' && err.code !== 27) {
        console.log(`Note: Legacy index "url_1" drop skipped: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not crash the process; log the error. In development, MongoDB might not be running.
  }
};
