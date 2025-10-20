import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: ['warn', 'error'], // Only log warnings and errors, disable query logging
  transactionOptions: {
    maxWait: 5000, // Maximum time to wait for a transaction to start
    timeout: 10000, // Maximum time a transaction can run
    isolationLevel: 'ReadCommitted', // Default isolation level
  },
});

export default prisma; 