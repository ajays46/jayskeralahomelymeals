import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
const backupDir = path.join(__dirname, 'migrations_backup_' + Date.now());

console.log('💾 Creating migration backup...');
console.log('📁 Source:', migrationsDir);
console.log('📁 Backup:', backupDir);

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Copy all migration files
let copiedCount = 0;
let errorCount = 0;

try {
  const migrations = fs.readdirSync(migrationsDir);
  
  migrations.forEach(item => {
    const sourcePath = path.join(migrationsDir, item);
    const destPath = path.join(backupDir, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(sourcePath, destPath, { recursive: true });
      console.log(`  ✅ Copied: ${item}/`);
      copiedCount++;
    } else if (fs.statSync(sourcePath).isFile()) {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  ✅ Copied: ${item}`);
      copiedCount++;
    }
  });
  
  console.log(`\n🎉 Backup completed successfully!`);
  console.log(`  📁 Backup location: ${backupDir}`);
  console.log(`  ✅ Files copied: ${copiedCount}`);
  
  // Create a restore script
  const restoreScript = `import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = '${backupDir.replace(/\\/g, '\\\\')}';
const targetDir = path.join(__dirname, 'prisma', 'migrations');

console.log('🔄 Restoring migrations from backup...');
console.log('📁 Source:', sourceDir);
console.log('📁 Target:', targetDir);

if (fs.existsSync(sourceDir)) {
  // Clear target directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  
  // Copy backup to target
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('✅ Migrations restored successfully!');
} else {
  console.error('❌ Backup directory not found!');
}`;

  fs.writeFileSync(path.join(__dirname, 'restore_migrations.js'), restoreScript);
  console.log(`  📝 Restore script created: restore_migrations.js`);
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  errorCount++;
}

if (errorCount > 0) {
  console.log(`  ❌ Errors: ${errorCount}`);
}

console.log('\n💡 You can now safely run the cleanup script.');
console.log('   Run: node cleanup_migrations.js');
