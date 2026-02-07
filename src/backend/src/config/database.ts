import mongoose from 'mongoose';

/**
 * Database connection configuration
 */
export const connectDatabase = async (): Promise<void> => {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    throw new Error('DB_URL environment variable is not set');
  }

  try {
    await mongoose.connect(dbUrl);
    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.once('open', () => {
      console.log('📦 Database connection opened');
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};
