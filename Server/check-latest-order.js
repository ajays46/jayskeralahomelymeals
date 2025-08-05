import prisma from './src/config/prisma.js';

async function checkLatestOrder() {
    try {
        console.log('🔍 Checking latest order...\n');

        const latestOrder = await prisma.order.findFirst({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                deliveryItems: {
                    include: {
                        menuItem: true,
                        deliveryAddress: true
                    }
                }
            }
        });

        if (!latestOrder) {
            console.log('❌ No orders found');
            return;
        }

        console.log(`📦 Order ID: ${latestOrder.id}`);
        console.log(`💰 Total Price: ₹${latestOrder.totalPrice}`);
        console.log(`📅 Order Date: ${latestOrder.orderDate.toISOString().split('T')[0]}`);
        console.log(`📊 Delivery Items: ${latestOrder.deliveryItems.length}\n`);

        console.log('📋 Delivery Items:');
        latestOrder.deliveryItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.deliveryDate.toISOString().split('T')[0]} - ${item.deliveryTimeSlot}`);
            console.log(`   Menu Item: ${item.menuItem.name}`);
            console.log(`   Menu Item ID: ${item.menuItemId}`);
            console.log(`   Address: ${item.deliveryAddress.street}, ${item.deliveryAddress.city}`);
            console.log(`   Price: ₹${item.total}`);
            console.log(`   Status: ${item.status}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestOrder(); 