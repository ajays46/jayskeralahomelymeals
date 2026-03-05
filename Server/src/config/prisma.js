import { PrismaClient } from '../generated/prisma/index.js';
import { logDatabaseQuery } from '../middleware/logging.middleware.js';

const SLOW_QUERY_MS = 300; // Log queries slower than this to app-transaction-*.log

const basePrisma = new PrismaClient({
  log: ['warn', 'error'], // Only log warnings and errors, disable query logging
  transactionOptions: {
    maxWait: 5000, // Maximum time to wait for a transaction to start
    timeout: 10000, // Maximum time a transaction can run
    isolationLevel: 'ReadCommitted', // Default isolation level
  },
});

const prisma = basePrisma.$extends({
  name: 'query-log',
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      const result = await query(args);
      const duration = Math.round(performance.now() - start);
      if (duration >= SLOW_QUERY_MS) {
        let rowCount = null;
        if (Array.isArray(result)) rowCount = result.length;
        else if (result !== undefined && result !== null) rowCount = 1;
        logDatabaseQuery(`${model || 'raw'}.${operation}`, duration, rowCount);
      }
      return result;
    },
  },
});

export default prisma; 