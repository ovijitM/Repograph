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

    // Seed default administrator user
    try {
      const User = mongoose.model('User');
      const adminEmail = 'okovijit@gmail.com';
      const existingAdmin = await User.findOne({ email: adminEmail });
      
      if (!existingAdmin) {
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash('$Moumitaovi1', salt);
        
        const newAdmin = new User({
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          credits: 999999
        });
        await newAdmin.save();
        console.log(`Successfully seeded default administrator user: ${adminEmail}`);
      } else if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`Updated existing user ${adminEmail} to admin role.`);
      }
    } catch (seedErr) {
      console.error('Error during administrator user seeding:', seedErr);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not crash the process; log the error. In development, MongoDB might not be running.
  }
};
