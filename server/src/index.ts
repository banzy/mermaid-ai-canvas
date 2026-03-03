import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import projectsRouter from './routes/projects.js';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'mindtoblocks';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/projects', projectsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    const uri = `${MONGODB_URI}/${DB_NAME}`;
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB: ${uri}`);

    app.listen(PORT, () => {
      console.log(`🚀 MindToBlocks API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();
