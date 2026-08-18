import mongoose from 'mongoose';

const IDLE_MS = Number(process.env.DB_IDLE_MS || 2 * 60 * 1000);

const MONGO_OPTS = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 10_000,
  serverSelectionTimeoutMS: 12_000,
};

let idleTimer = null;
let connecting = null;

function mongoUri() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
}

export function touchDbIdle() {
  if (process.env.USE_MEMORY_DB === 'true') return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.disconnect();
        console.log('MongoDB desconectado por inactividad (Railway Serverless).');
      } catch {
        /* ignore */
      }
    }
  }, IDLE_MS);
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2 && connecting) return connecting;
  if (connecting) return connecting;

  connecting = (async () => {
    if (process.env.USE_MEMORY_DB === 'true') {
      if (mongoose.connection.readyState === 0) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mem = await MongoMemoryServer.create();
        await mongoose.connect(mem.getUri(), MONGO_OPTS);
        console.log('✅ MongoDB en memoria (dev):', mongoose.connection.db.databaseName);
      }
      return mongoose.connection;
    }

    await mongoose.connect(mongoUri(), MONGO_OPTS);
    console.log('✅ MongoDB conectado a:', mongoose.connection.db.databaseName);
    return mongoose.connection;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

export async function ensureDb(req, res, next) {
  try {
    await connectDB();
    touchDbIdle();
    next();
  } catch (err) {
    console.error('MongoDB no disponible:', err.message);
    res.status(503).json({ message: 'El servidor está despertando. Reintentá en unos segundos.' });
  }
}
