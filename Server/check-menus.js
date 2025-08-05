import prisma from './src/config/prisma.js';

async function checkMenus() {
    try {
        console.log('🔍 Checking available menus...\n');

        const menus = await prisma.menu.findMany({
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

        console.log(`📋 Found ${menus.length} menus:\n`);

        menus.forEach((menu, index) => {
            console.log(`${index + 1}. Menu: "${menu.name}"`);
            console.log(`   ID: ${menu.id}`);
            console.log(`   Status: ${menu.status}`);
            console.log(`   Menu Items: ${menu.menuItems.length}`);
            
            menu.menuItems.forEach((item, itemIndex) => {
                console.log(`     ${itemIndex + 1}. "${item.name}" - ₹${item.prices[0]?.totalPrice || 'No price'}`);
            });
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMenus(); 