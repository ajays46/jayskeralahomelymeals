const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testOrderCreation() {
  try {
    console.log('🧪 Testing Order Creation with Delivery Items...\n');

    // 1. Get a sample user
    const user = await prisma.user.findFirst({
      include: {
        addresses: true
      }
    });

    if (!user) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found user: ${user.customerId}`);

    // 2. Get a sample menu with menu items
    const menu = await prisma.menu.findFirst({
      include: {
        menuItems: {
          include: {
            prices: true
          }
        }
      }
    });

    if (!menu) {
      console.log('❌ No menus found in database');
      return;
    }

    console.log(`✅ Found menu: ${menu.name}`);

    // 3. Get user addresses
    const addresses = user.addresses;
    if (addresses.length === 0) {
      console.log('❌ No addresses found for user');
      return;
    }

    console.log(`✅ Found ${addresses.length} addresses for user`);

    // 4. Create a test order
    const orderData = {
      orderDate: new Date().toISOString().split('T')[0],
      orderTimes: ['Morning', 'Noon', 'Night'],
      orderItems: menu.menuItems.slice(0, 3).map(item => ({
        menuItemId: item.id,
        quantity: 1
      })),
      deliveryAddressId: addresses[0].id,
      deliverySchedule: {
        breakfast: {
          mealTime: 'Morning',
          deliveryAddressId: addresses[0].id,
          items: menu.menuItems.slice(0, 1).map(item => ({
            menuItemId: item.id,
            name: item.name,
            quantity: 1
          }))
        },
        lunch: {
          mealTime: 'Noon',
          deliveryAddressId: addresses[1] ? addresses[1].id : addresses[0].id,
          items: menu.menuItems.slice(1, 2).map(item => ({
            menuItemId: item.id,
            name: item.name,
            quantity: 1
          }))
        },
        dinner: {
          mealTime: 'Night',
          deliveryAddressId: addresses[2] ? addresses[2].id : addresses[0].id,
          items: menu.menuItems.slice(2, 3).map(item => ({
            menuItemId: item.id,
            name: item.name,
            quantity: 1
          }))
        }
      },
      selectedDates: [new Date().toISOString().split('T')[0]],
      orderMode: 'single',
      menuId: menu.id,
      menuName: menu.name
    };

    console.log('\n📋 Creating order with data:', JSON.stringify(orderData, null, 2));

    // 5. Create the order using the service
    const { createOrderService } = require('./src/services/order.service.js');
    
    const order = await createOrderService(user.id, orderData);
    
    console.log('\n✅ Order created successfully!');
    console.log(`📦 Order ID: ${order.id}`);
    console.log(`💰 Total Price: ${order.totalPrice}`);
    console.log(`📅 Order Date: ${order.orderDate}`);
    console.log(`📦 Delivery Items Count: ${order.deliveryItems.length}`);

    // 6. Display delivery items
    console.log('\n🚚 Delivery Items:');
    order.deliveryItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.menuItem.name} - ${item.deliveryTimeSlot} - ${item.deliveryDate} - ₹${item.total}`);
    });

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderCreation(); 