import { PrismaClient } from '../generated/kitchen-prisma/index.js';

const SLOW_QUERY_MS = 300;

const baseKitchenPrisma = new PrismaClient({
  log: ['warn', 'error'],
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'ReadCommitted',
  },
});

const kitchenPrisma = baseKitchenPrisma.$extends({
  name: 'kitchen-query-log',
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      const result = await query(args);
      const duration = Math.round(performance.now() - start);
      if (duration >= SLOW_QUERY_MS) {
        let rowCount = null;
        if (Array.isArray(result)) rowCount = result.length;
        else if (result !== undefined && result !== null) rowCount = 1;
        try {
          const { logDatabaseQuery } = await import('../middleware/logging.middleware.js');
          logDatabaseQuery(`kitchen:${model || 'raw'}.${operation}`, duration, rowCount);
        } catch { /* logging is best-effort */ }
      }
      return result;
    },
  },
});

export default kitchenPrisma;
