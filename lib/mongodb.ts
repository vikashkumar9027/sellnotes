import mongoose from 'mongoose';
import dns from 'dns';

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if not supported in runtime
}

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
  let rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notemart';

  // 1. Auto-sanitize: Remove accidental "MONGODB_URI=" prefix if pasted into Vercel Value box
  let uri = rawUri.trim();
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.replace(/^MONGODB_URI=/, '').trim();
  }
  // 2. Remove any accidental surrounding quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // 3. Auto-replace placeholders if user pasted with <db_username> or <db_password>
  if (uri.includes('<db_username>') || uri.includes('<username>')) {
    uri = uri.replace('<db_username>', 'admin').replace('<username>', 'admin');
  }
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    uri = uri.replace('<db_password>', 'NoteMart2026').replace('<password>', 'NoteMart2026');
  }

  // 4. Ensure database name 'notemart' is present in connection path
  if (uri.includes('.mongodb.net/?')) {
    uri = uri.replace('.mongodb.net/?', '.mongodb.net/notemart?');
  } else if (uri.endsWith('.mongodb.net') || uri.endsWith('.mongodb.net/')) {
    uri = uri.replace(/\.mongodb\.net\/?$/, '.mongodb.net/notemart');
  }

  // If URI still contains dummy example text, give clear error
  if (
    uri.includes('xxxxx') ||
    uri.includes('YOUR_')
  ) {
    const errorMsg = 'MongoDB Atlas URI me placeholder "xxxxx" laga hua hai. Kripya Vercel me apna real MongoDB Atlas connection string dalein.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  if (isVercel && (!process.env.MONGODB_URI || uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    const errorMsg = 'Vercel par remote MONGODB_URI environment variable set nahi hai. Kripya Vercel me MongoDB Atlas URI configure karein.';
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
