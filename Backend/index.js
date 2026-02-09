import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import ConnectDb from './config/Db.js';
import redis from './config/RedisDb.js';

import apiRouter from './route/apiRouter.js';
import "./worker/activityWorker.js"; // Initialize background worker
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/activity', authLimiter); // Requirement 7: Rate limit activity logs

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

ConnectDb();

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// 404 Fallback Logger
app.use((req, res) => {
  console.warn(`[404] Resource not found: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  if (redis.status === 'ready') {
    console.log('Redis is connected and ready!');
  } else {
    console.log('Redis status:', redis.status);
  }
});