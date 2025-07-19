import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test the connection
prisma.$connect()
  .then(() => {
    // Database connected successfully
  })
  .catch(err => {
    // Database connection failed
  });

export default prisma; 