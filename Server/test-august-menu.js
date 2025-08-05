// Test script to create August Menu with Monthly Plan
// This shows how to structure your data with the existing schema

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function createAugustMenu() {
  try {
    console.log('Creating August Menu with Monthly Plan...');

    // 1. Create or get company
    const company = await prisma.company.upsert({
      where: { id: 'comp_001' },
      update: {},
      create: {
        id: 'comp_001',
        name: 'Jays Kerala Home Meals',
        address_id: 'addr_001'
      }
    });
    console.log('✅ Company created/found:', company.name);

    // 2. Create product (if not exists)
    const product = await prisma.product.upsert({
      where: { code: 'MONTHLY_PLAN_001' },
      update: {},
      create: {
        companyId: company.id,
        code: 'MONTHLY_PLAN_001',
        productName: 'Monthly Meal Plan',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Product created/found:', product.productName);

    // 3. Create August Menu
    const menu = await prisma.menu.upsert({
      where: { id: 'menu_001' },
      update: {},
      create: {
        id: 'menu_001',
        name: 'August Menu',
        companyId: company.id,
        status: 'ACTIVE'
      }
    });
    console.log('✅ Menu created/found:', menu.name);

    // 4. Create VEG category for the menu
    const menuCategory = await prisma.menuCategory.upsert({
      where: { 
        id: 'cat_001'
      },
      update: {},
      create: {
        id: 'cat_001',
        menuId: menu.id,
        companyId: company.id,
        name: 'VEG',
        description: 'Vegetarian meal plan including breakfast, lunch, and dinner'
      }
    });
    console.log('✅ Menu category created/found:', menuCategory.name);

    // 5. Create Monthly Plan menu item
    const menuItem = await prisma.menuItem.upsert({
      where: { id: 'menuitem_001' },
      update: {},
      create: {
        id: 'menuitem_001',
        name: 'Monthly Plan',
        menuId: menu.id,
        productId: product.id
      }
    });
    console.log('✅ Menu item created/found:', menuItem.name);

    // 6. Create price for the menu item
    const menuItemPrice = await prisma.menuItemPrice.upsert({
      where: { id: 'price_001' },
      update: {},
      create: {
        id: 'price_001',
        menuItemId: menuItem.id,
        companyId: company.id,
        totalPrice: 9000 // ₹9000 for monthly plan
      }
    });
    console.log('✅ Menu item price created/found: ₹', menuItemPrice.totalPrice);

    // 7. Fetch the complete menu structure
    const completeMenu = await prisma.menu.findUnique({
      where: { id: menu.id },
      include: {
        company: true,
        menuCategories: true,
        menuItems: {
          include: {
            product: true,
            prices: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    console.log('\n📋 Complete Menu Structure:');
    console.log('Menu:', completeMenu.name);
    console.log('Categories:', completeMenu.menuCategories.map(cat => cat.name));
    console.log('Menu Items:', completeMenu.menuItems.map(item => ({
      name: item.name,
      product: item.product?.productName,
      price: item.prices[0]?.totalPrice
    })));

    console.log('\n🎯 How this works with your booking system:');
    console.log('1. The backend will detect this as a "comprehensive menu"');
    console.log('2. It will automatically create breakfast, lunch, dinner options');
    console.log('3. Each meal type will show ₹3000 (₹9000 ÷ 3)');
    console.log('4. Users can select different delivery addresses for each meal');
    console.log('5. The system will handle the order creation with proper delivery scheduling');

    return completeMenu;

  } catch (error) {
    console.error('❌ Error creating August Menu:', error);
    throw error;
  }
}

// Run the function
createAugustMenu()
  .then(() => {
    console.log('\n✅ August Menu setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }); 