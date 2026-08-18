import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

  if (process.env.USE_MEMORY_DB === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    const memUri = mem.getUri();
    await mongoose.connect(memUri);
    console.log('✅ MongoDB en memoria (dev):', mongoose.connection.db.databaseName);
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado a:', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('❌ Error MongoDB:', err.message);
    console.error('   Tip: instalá MongoDB local o seteá USE_MEMORY_DB=true en .env');
    process.exit(1);
  }
}
