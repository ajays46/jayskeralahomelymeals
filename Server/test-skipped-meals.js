import prisma from './src/config/prisma.js';
import { createOrderService } from './src/services/order.service.js';

async function testSkippedMeals() {
    try {
        console.log('🧪 Testing Skipped Meals Order Creation...\n');

        // Get a sample user
        const user = await prisma.user.findFirst({
            include: {
                addresses: true
            }
        });

        if (!user) {
            console.error('❌ No user found in database');
            return;
        }

        console.log(`👤 Using user: ${user.customerId}`);

        // Get the "Agust menu"
        const augustMenu = await prisma.menu.findFirst({
            where: {
                name: {
                    contains: 'agust'
                }
            },
            include: {
                menuItems: {
                    include: {
                        prices: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!augustMenu) {
            console.error('❌ August Menu not found');
            return;
        }

        console.log(`📋 Found menu: "${augustMenu.name}"`);

        // Find the "Monthly menu" menu item
        const monthlyMenuItem = augustMenu.menuItems.find(item => 
            item.name.toLowerCase().includes('monthly menu')
        );

        if (!monthlyMenuItem) {
            console.error('❌ Monthly Menu item not found');
            return;
        }

        console.log(`🍽️ Found menu item: "${monthlyMenuItem.name}"`);
        console.log(`💰 Price: ₹${monthlyMenuItem.prices[0]?.totalPrice || 'No price'}`);

        // Get user addresses
        const addresses = user.addresses;
        if (addresses.length === 0) {
            console.error('❌ No addresses found for user');
            return;
        }

        const primaryAddress = addresses[0];
        console.log(`📍 Using address: ${primaryAddress.street}, ${primaryAddress.city}`);

        // Create test dates (3 days)
        const testDates = [];
        const startDate = new Date();
        for (let i = 0; i < 3; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            testDates.push(date.toISOString().split('T')[0]);
        }

        console.log(`📅 Test dates: ${testDates.join(', ')}`);

        // Create skip meals data - skip breakfast on day 1, lunch on day 2, dinner on day 3
        const skipMeals = {
            [testDates[0]]: { breakfast: true }, // Skip breakfast on day 1
            [testDates[1]]: { lunch: true },     // Skip lunch on day 2
            [testDates[2]]: { dinner: true }     // Skip dinner on day 3
        };

        console.log('🚫 Skipped meals:');
        console.log(`   Day 1 (${testDates[0]}): Skip Breakfast`);
        console.log(`   Day 2 (${testDates[1]}): Skip Lunch`);
        console.log(`   Day 3 (${testDates[2]}): Skip Dinner`);

        // Create order data
        const orderData = {
            orderDate: testDates[0],
            orderTimes: ['Morning', 'Noon', 'Night'],
            orderItems: [{
                menuItemId: monthlyMenuItem.id,
                quantity: 1
            }],
            deliveryAddressId: primaryAddress.id,
            deliveryLocations: {
                breakfast: primaryAddress.id,
                lunch: primaryAddress.id,
                dinner: primaryAddress.id,
                full: primaryAddress.id
            },
            selectedDates: testDates,
            orderMode: 'multiple',
            menuId: augustMenu.id,
            menuName: augustMenu.name,
            skipMeals: skipMeals
        };

        console.log('\n🚀 Creating order with skipped meals...');
        
        // Create the order
        const order = await createOrderService(user.id, orderData);

        console.log('\n✅ Order created successfully!');
        console.log(`📦 Order ID: ${order.id}`);
        console.log(`💰 Total Price: ₹${order.totalPrice}`);
        console.log(`📅 Order Date: ${order.orderDate.toISOString().split('T')[0]}`);
        console.log(`📊 Delivery Items: ${order.deliveryItems.length}`);

        // Display delivery items
        console.log('\n📋 Delivery Items Created:');
        order.deliveryItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.deliveryDate.toISOString().split('T')[0]} - ${item.deliveryTimeSlot}`);
            console.log(`   Menu Item: ${item.menuItem.name}`);
            console.log(`   Address: ${item.deliveryAddress.street}, ${item.deliveryAddress.city}`);
            console.log(`   Price: ₹${item.total}`);
            console.log(`   Status: ${item.status}\n`);
        });

        // Verify the structure matches expectations
        console.log('🔍 Verification:');
        console.log(`✅ Order created with ID: ${order.id}`);
        console.log(`✅ Expected delivery items: 6 (3 days × 3 meals - 3 skipped meals)`);
        console.log(`✅ Actual delivery items: ${order.deliveryItems.length}`);
        
        const expectedCount = 6; // 3 days × 3 meals - 3 skipped meals
        if (order.deliveryItems.length === expectedCount) {
            console.log(`\n🎉 SUCCESS! Created exactly ${expectedCount} delivery items as expected!`);
            console.log('✅ Skipped meals correctly excluded from delivery items');
        } else {
            console.log(`\n⚠️  WARNING: Expected ${expectedCount} items but got ${order.deliveryItems.length}`);
        }

        // Check that skipped meals are not in delivery items
        const skippedMealsInDelivery = order.deliveryItems.filter(item => {
            const dateStr = item.deliveryDate.toISOString().split('T')[0];
            const skippedMealsForDate = skipMeals[dateStr] || {};
            return skippedMealsForDate[item.deliveryTimeSlot.toLowerCase()];
        });

        if (skippedMealsInDelivery.length === 0) {
            console.log('✅ No skipped meals found in delivery items - Perfect!');
        } else {
            console.log(`❌ Found ${skippedMealsInDelivery.length} skipped meals in delivery items - This is wrong!`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testSkippedMeals(); 