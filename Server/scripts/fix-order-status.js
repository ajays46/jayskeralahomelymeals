/**
 * One-time fix: set any empty or invalid OrderStatus in DB to 'Pending'.
 * Run when you see: "Value '' not found in enum 'OrderStatus'"
 *
 * Usage: node scripts/fix-order-status.js
 * (from Server directory: node scripts/fix-order-status.js)
 */

import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Fixing empty/invalid OrderStatus in orders and delivery_items...');

  try {
    // Fix orders table (MySQL: status is enum, empty string may exist from old data)
    const ordersResult = await prisma.$executeRawUnsafe(`
      UPDATE orders SET status = 'Pending' WHERE status = '' OR status IS NULL
    `);
    console.log('orders: updated', ordersResult, 'row(s)');

    // Fix delivery_items table
    const deliveryResult = await prisma.$executeRawUnsafe(`
      UPDATE delivery_items SET status = 'Pending' WHERE status = '' OR status IS NULL
    `);
    console.log('delivery_items: updated', deliveryResult, 'row(s)');

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
