import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrateToPrisma() {
  try {
    console.log('Starting migration to Prisma...');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    const { execSync } = await import('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database
    console.log('Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPrisma(); 