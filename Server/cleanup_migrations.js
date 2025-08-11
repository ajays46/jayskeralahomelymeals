const fs = require('fs');
const path = require('path');

// List of migrations to REMOVE (problematic ones)
const migrationsToRemove = [
  '20250723044614_new_migration',
  '20250807052923_remove_total_from_delivery_items',
  '20250808063033_verify_fix',
  '20250728060102_add_product_name_to_menu_items',
  '20250728060233_remove_product_id_from_menu_items',
  '20250728064940_remove_category_and_product_name_from_menu_items',
  '20250728070743_add_product_name_back_to_menu_items',
  '20250731102153_remove_food_type_from_menu_item',
  '20250801104845_make_image_url_optional',
  '20250801110717_update_menu_item_to_use_product_id',
  '20250805113053_sync_schema'
];

// List of migrations to KEEP (essential ones)
const migrationsToKeep = [
  '20250626183544_dev',
  '20250705105356_add_company',
  '20250716051139_add_product_model',
  '20250716051614_add_product_prices_quantities_menus',
  '20250717042043_add_product_categories',
  '20250718065408_update_menu_to_day_of_week',
  '20250722044044_add_menu_item_prices_and_categories',
  '20250723104626_add_address_model',
  '20250724062118_add_order_system',
  '20250724090431_add_delivery_schedule_field',
  '20250726101938_add_customer_id_to_users',
  '20250726104408_add_category_id_to_menu_items',
  '20250806064015_add_user_id_to_delivery_items',
  '20250806084811_add_contacts_and_phone_numbers',
  '20250806104658_add_payment_models',
  '20250808042143_support_multiple_user_roles'
];

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

console.log('🔍 Starting migration cleanup...');
console.log('📁 Migrations directory:', migrationsDir);

// Check if migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  console.error('❌ Migrations directory not found!');
  process.exit(1);
}

// Get all migration directories
const allMigrations = fs.readdirSync(migrationsDir)
  .filter(item => fs.statSync(path.join(migrationsDir, item)).isDirectory())
  .filter(item => item !== 'migration_lock.toml');

console.log('\n📋 Found migrations:');
allMigrations.forEach(migration => {
  const status = migrationsToRemove.includes(migration) ? '❌ REMOVE' : '✅ KEEP';
  console.log(`  ${status} ${migration}`);
});

console.log('\n⚠️  WARNING: This will delete the following migrations:');
migrationsToRemove.forEach(migration => {
  console.log(`  - ${migration}`);
});

console.log('\n💡 After cleanup, you should:');
console.log('  1. Run: npx prisma migrate reset');
console.log('  2. Run: npx prisma migrate dev --name init');
console.log('  3. Run: npx prisma generate');

// Ask for confirmation
console.log('\n❓ Do you want to proceed with cleanup? (yes/no)');
process.stdin.once('data', (data) => {
  const answer = data.toString().trim().toLowerCase();
  
  if (answer === 'yes' || answer === 'y') {
    console.log('\n🗑️  Starting cleanup...');
    
    let removedCount = 0;
    let errorCount = 0;
    
    migrationsToRemove.forEach(migration => {
      const migrationPath = path.join(migrationsDir, migration);
      if (fs.existsSync(migrationPath)) {
        try {
          fs.rmSync(migrationPath, { recursive: true, force: true });
          console.log(`  ✅ Removed: ${migration}`);
          removedCount++;
        } catch (error) {
          console.error(`  ❌ Error removing ${migration}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ⚠️  Not found: ${migration}`);
      }
    });
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`  ✅ Removed: ${removedCount} migrations`);
    if (errorCount > 0) {
      console.log(`  ❌ Errors: ${errorCount} migrations`);
    }
    
    console.log('\n📝 Next steps:');
    console.log('  1. cd Server');
    console.log('  2. npx prisma migrate reset');
    console.log('  3. npx prisma migrate dev --name init');
    console.log('  4. npx prisma generate');
    console.log('  5. npm start');
    
  } else {
    console.log('\n❌ Cleanup cancelled.');
  }
  
  process.exit(0);
});
