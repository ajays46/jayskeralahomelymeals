import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: [],
});

export default prisma; 