import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notemart';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  const isVercel = Boolean(process.env.VERCEL);
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notemart';

  // If on Vercel and URI still points to localhost, skip attempting to avoid 10s serverless timeout
  if (isVercel && (!process.env.MONGODB_URI || uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    const errorMsg = 'Skipping MongoDB connection on Vercel: Remote MONGODB_URI is not set in Vercel environment variables.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: isVercel ? 2500 : 5000,
      connectTimeoutMS: isVercel ? 2500 : 5000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('MongoDB connected successfully:', m.connection.name);
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return cached!.conn;
}
