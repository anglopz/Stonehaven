import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Use project-local cache for MongoDB binaries (avoids EACCES on ~/.cache in CI/sandbox)
if (!process.env.MONGOMS_DOWNLOAD_DIR) {
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(
    __dirname,
    '../../node_modules/.cache/mongodb-binaries'
  );
}

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Teardown after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
