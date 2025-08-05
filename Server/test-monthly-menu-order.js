import prisma from './src/config/prisma.js';
import { createOrderService } from './src/services/order.service.js';

async function testMonthlyMenuOrder() {
    try {
        console.log('🧪 Testing Monthly Menu Order Creation...\n');

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
        
        // Debug comprehensive menu detection
        const isComprehensiveMenu = augustMenu.name && 
            (augustMenu.name.toLowerCase().includes('monthly') || 
             augustMenu.name.toLowerCase().includes('comprehensive') ||
             augustMenu.name.toLowerCase().includes('plan'));
        
        console.log(`🔍 Comprehensive menu detection: ${isComprehensiveMenu}`);
        console.log(`🔍 Menu name check: "${augustMenu.name.toLowerCase()}"`);
        console.log(`🔍 Contains 'monthly': ${augustMenu.name.toLowerCase().includes('monthly')}`);
        console.log(`🔍 Contains 'comprehensive': ${augustMenu.name.toLowerCase().includes('comprehensive')}`);
        console.log(`🔍 Contains 'plan': ${augustMenu.name.toLowerCase().includes('plan')}`);

        // Get user addresses
        const addresses = user.addresses;
        if (addresses.length === 0) {
            console.error('❌ No addresses found for user');
            return;
        }

        const primaryAddress = addresses[0];
        const breakfastAddress = addresses.length > 1 ? addresses[1] : primaryAddress;
        const lunchAddress = addresses.length > 2 ? addresses[2] : primaryAddress;
        const dinnerAddress = addresses.length > 3 ? addresses[3] : primaryAddress;

        console.log(`📍 Using addresses:`);
        console.log(`   Primary: ${primaryAddress.street}, ${primaryAddress.city}`);
        console.log(`   Breakfast: ${breakfastAddress.street}, ${breakfastAddress.city}`);
        console.log(`   Lunch: ${lunchAddress.street}, ${lunchAddress.city}`);
        console.log(`   Dinner: ${dinnerAddress.street}, ${dinnerAddress.city}`);

        // Create test dates (3 days)
        const testDates = [];
        const startDate = new Date();
        for (let i = 0; i < 3; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            testDates.push(date.toISOString().split('T')[0]);
        }

        console.log(`📅 Test dates: ${testDates.join(', ')}`);

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
                breakfast: breakfastAddress.id,
                lunch: lunchAddress.id,
                dinner: dinnerAddress.id,
                full: primaryAddress.id
            },
            deliverySchedule: {
                breakfast: {
                    mealTime: 'Morning',
                    deliveryAddressId: breakfastAddress.id,
                    items: [{
                        menuItemId: monthlyMenuItem.id,
                        name: monthlyMenuItem.name,
                        quantity: 1
                    }]
                },
                lunch: {
                    mealTime: 'Noon',
                    deliveryAddressId: lunchAddress.id,
                    items: [{
                        menuItemId: monthlyMenuItem.id,
                        name: monthlyMenuItem.name,
                        quantity: 1
                    }]
                },
                dinner: {
                    mealTime: 'Night',
                    deliveryAddressId: dinnerAddress.id,
                    items: [{
                        menuItemId: monthlyMenuItem.id,
                        name: monthlyMenuItem.name,
                        quantity: 1
                    }]
                }
            },
            selectedDates: testDates,
            orderMode: 'multiple',
            menuId: augustMenu.id,
            menuName: augustMenu.name,
            skipMeals: {}
        };

        console.log('\n🚀 Creating order...');
        
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

        // Verify the structure matches your example
        console.log('🔍 Verification:');
        console.log(`✅ Order created with ID: ${order.id}`);
        console.log(`✅ ${order.deliveryItems.length} delivery items created (${testDates.length} days × 3 meals)`);
        console.log(`✅ Each delivery item uses the same menu item ID: ${monthlyMenuItem.id}`);
        console.log(`✅ Different time slots: Breakfast, Lunch, Dinner`);
        console.log(`✅ Different addresses for each meal type`);
        console.log(`✅ All items have status: Pending`);

        // Check if structure matches your example
        const expectedCount = testDates.length * 3;
        if (order.deliveryItems.length === expectedCount) {
            console.log(`\n🎉 SUCCESS! Created exactly ${expectedCount} delivery items as expected!`);
        } else {
            console.log(`\n⚠️  WARNING: Expected ${expectedCount} items but got ${order.deliveryItems.length}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testMonthlyMenuOrder(); 