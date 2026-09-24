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

  // 5. Bypass fragile DNS SRV lookups on networks/Windows where SRV fails (querySrv ECONNREFUSED)
  if (uri.startsWith('mongodb+srv://') && uri.includes('cluster0.atk8e6d.mongodb.net')) {
    const credMatch = uri.match(/mongodb\+srv:\/\/([^@]+)@cluster0\.atk8e6d\.mongodb\.net\/?([^?]*)(\?.*)?/);
    if (credMatch) {
      const credentials = credMatch[1];
      const dbName = credMatch[2] || 'notemart';
      uri = `mongodb://${credentials}@ac-obd8wen-shard-00-00.atk8e6d.mongodb.net:27017,ac-obd8wen-shard-00-01.atk8e6d.mongodb.net:27017,ac-obd8wen-shard-00-02.atk8e6d.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-flnl1r-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }

  // Ensure Google DNS is set right before connecting
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // runtime does not support dns.setServers
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: isVercel ? 4000 : 6000,
      connectTimeoutMS: isVercel ? 4000 : 6000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('MongoDB connected successfully:', m.connection.name);
      return m;
    }).catch(async (initialErr) => {
      // If SRV failure occurred on another Atlas cluster, attempt DNS fallback
      if (initialErr?.message?.includes('querySrv') || initialErr?.message?.includes('ECONNREFUSED')) {
        console.warn('Initial SRV connection failed, retrying with Google DNS setServers...');
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1']);
          return await mongoose.connect(uri, opts);
        } catch (retryErr) {
          throw retryErr;
        }
      }
      throw initialErr;
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
