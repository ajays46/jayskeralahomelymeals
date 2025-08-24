import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

// Reduce product quantities based on order items (using existing ProductQuantity table)
export const reduceProductQuantitiesService = async (orderItems, selectedDates, skipMeals = {}) => {
  try {
    
    const quantityReductions = [];
    
    // Get a default company ID for creating products
    let defaultCompanyId = null;
    try {
      const firstCompany = await prisma.company.findFirst({
        select: { id: true }
      });
      defaultCompanyId = firstCompany?.id || 'default-company-id';
    } catch (error) {
      console.warn('Could not find company, using fallback ID');
      defaultCompanyId = 'default-company-id';
    }

    // Group order items by menuItemId to handle package menus correctly
    const groupedOrderItems = {};
    for (const item of orderItems) {
      if (!groupedOrderItems[item.menuItemId]) {
        groupedOrderItems[item.menuItemId] = [];
      }
      groupedOrderItems[item.menuItemId].push(item);
    }



    for (const menuItemId in groupedOrderItems) {
      const itemsForMenuItem = groupedOrderItems[menuItemId];
      const firstItem = itemsForMenuItem[0]; // Use first item to get general info



      // Get the menu item to find the associated product
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        include: { product: true }
      });

      if (!menuItem) {
        console.warn(`⚠️ MenuItem ${menuItemId} not found, skipping quantity reduction`);
        continue;
      }

      let productId = menuItem.productId;
      let productName = menuItem.name; // Use menu item name as fallback

      if (!productId) {

        let existingProduct = await prisma.product.findFirst({
          where: {
            productName: {
              equals: menuItem.name,
              mode: 'insensitive'
            }
          }
        });

        if (!existingProduct) {
          existingProduct = await prisma.product.create({
            data: {
              code: `MENU_${menuItem.id.substring(0, 8)}`,
              productName: menuItem.name,
              companyId: defaultCompanyId,
              status: 'ACTIVE'
            }
          });

        }

        productId = existingProduct.id;
        productName = existingProduct.productName;

        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: { productId: productId }
        });

      } else {
        productName = menuItem.product?.productName || menuItem.name;
      }

      const isPackageMenu = await checkIfPackageMenu(menuItem);

      let totalProductsNeeded = 0;

      if (isPackageMenu) {
        // For package menus: always 1 product per package, regardless of selected days or meal types
        // Even if frontend sends multiple orderItems for different meal types, it's still 1 package
        totalProductsNeeded = 1;

      } else {
        // For daily rates: 1 product per unique (date, mealType) combination
        const processedCombinations = new Set();
        for (const date of selectedDates) {
          const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
          
          for (const item of itemsForMenuItem) { // Iterate over items for this specific menuItemId
            if (skipMeals && skipMeals[dateStr] && skipMeals[dateStr][item.mealType]) {
              continue; // Skip this meal for this date
            }
            const combinationKey = `${dateStr}-${item.mealType}`;
            if (!processedCombinations.has(combinationKey)) {
              totalProductsNeeded += 1;
              processedCombinations.add(combinationKey);
            }
          }
        }

      }

      if (totalProductsNeeded === 0) {

        continue; // No products needed for this item
      }

      let productQuantity = await prisma.productQuantity.findFirst({
        where: { productId: productId },
        orderBy: { createdAt: 'asc' }
      });

      if (!productQuantity) {

        productQuantity = await prisma.productQuantity.create({
          data: {
            productId: productId,
            date: new Date(),
            quantity: 100
          }
        });

      }

      if (productQuantity.quantity < totalProductsNeeded) {
        throw new AppError(
          `Insufficient quantity for product ${productName}. Available: ${productQuantity.quantity}, Required: ${totalProductsNeeded}`,
          400
        );
      }

      const updatedQuantity = await prisma.productQuantity.update({
        where: { id: productQuantity.id },
        data: {
          quantity: productQuantity.quantity - totalProductsNeeded,
          updatedAt: new Date()
        }
      });

      quantityReductions.push({
        productId: productId,
        productName: productName,
        totalProductsNeeded: totalProductsNeeded,
        originalQuantity: productQuantity.quantity,
        reducedQuantity: totalProductsNeeded,
        newQuantity: updatedQuantity.quantity,
        menuType: isPackageMenu ? 'Package Menu' : 'Daily Rates'
      });


    }



    return {
      success: true,
      message: 'Product quantities reduced successfully',
      reductions: quantityReductions,
      summary: {
        total: quantityReductions.length,
        totalProductsReduced: quantityReductions.reduce((sum, r) => sum + r.reducedQuantity, 0)
      }
    };

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('❌ Error reducing product quantities:', error);
    throw new AppError('Failed to reduce product quantities', 500);
  }
};

// Helper function to check if a menu item is a package menu
async function checkIfPackageMenu(menuItem) {
  try {

    
    // Check if this menu item is part of a package menu
    // We'll check the menu structure to determine this
    
    // Get the menu that contains this menu item
    const menu = await prisma.menu.findFirst({
      where: {
        menuItems: {
          some: {
            id: menuItem.id
          }
        }
      },
      include: {
        menuItems: true
      }
    });
    
    if (!menu) {

      return false; // Not part of a menu, treat as daily rates
    }
    

    
    // Check if this is a package menu based on menu name or structure
    const menuName = menu.name?.toLowerCase() || '';
    const menuItemName = menuItem.name?.toLowerCase() || '';
    

    
    // Package menus: monthly, weekly, weekday, weekend (including "RATES" versions)
    // "WEEKLY RATES" = Package menu (1 product for 7 days)
    // "MONTHLY RATES" = Package menu (1 product for 30 days)
    // "WEEKDAY RATES" = Package menu (1 product for 5 days)
    // "WEEKEND RATES" = Package menu (1 product for 2 days)
    const isPackageMenu = 
      (menuName.includes('monthly') || menuName.includes('month') || menuItemName.includes('monthly') || menuItemName.includes('month')) ||
      (menuName.includes('weekly') || menuName.includes('week') || menuItemName.includes('weekly') || menuItemName.includes('week')) ||
      (menuName.includes('weekday') || menuName.includes('week-day') || menuItemName.includes('weekday') || menuItemName.includes('week-day')) ||
      (menuName.includes('weekend') || menuName.includes('week-end') || menuItemName.includes('weekend') || menuItemName.includes('week-end')) ||
      (menuName.includes('saturday') || menuName.includes('sunday') || menuItemName.includes('saturday') || menuItemName.includes('sunday'));
    
    // Daily rates: only individual day selection (NOT weekly/monthly/weekday/weekend)
    // "DAILY RATES" = Daily rates (1 product per day)
    const isDailyRates = 
      (menuName.includes('daily rates') || menuName.includes('daily rate') || menuItemName.includes('daily rates') || menuItemName.includes('daily rate')) &&
      !isPackageMenu; // Only if it's NOT a package menu
    

    
    // Return the detection result
    if (isPackageMenu) {
      return true;
    } else {
      return false;
    }
    
  } catch (error) {
    console.error('❌ [checkIfPackageMenu] Error checking if package menu:', error);
    // Default to treating as daily rates if we can't determine
    return false;
  }
}

// Increase product quantities when orders are cancelled
export const increaseProductQuantitiesService = async (orderItems) => {
  try {
    
    const quantityRestorations = [];
    
    // Group order items by menuItemId to handle package menus correctly
    const groupedOrderItems = {};
    for (const item of orderItems) {
      if (!groupedOrderItems[item.menuItemId]) {
        groupedOrderItems[item.menuItemId] = [];
      }
      groupedOrderItems[item.menuItemId].push(item);
    }



    for (const menuItemId in groupedOrderItems) {
      const itemsForMenuItem = groupedOrderItems[menuItemId];
      const firstItem = itemsForMenuItem[0]; // Use first item to get general info



      // Get the menu item to find the associated product
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        include: { product: true }
      });

      if (!menuItem) {
        console.warn(`⚠️ MenuItem ${menuItemId} not found, skipping quantity restoration`);
        continue;
      }

      let productId = menuItem.productId;
      let productName = menuItem.name; // Use menu item name as fallback

      if (!productId) {

        continue;
      } else {
        productName = menuItem.product?.productName || menuItem.name;
      }

      const isPackageMenu = await checkIfPackageMenu(menuItem);

      let totalProductsToRestore = 0;

      if (isPackageMenu) {
        // For package menus: always 1 product per package, regardless of meal types
        totalProductsToRestore = 1;

      } else {
        // For daily rates: count the total quantity from all items
        totalProductsToRestore = itemsForMenuItem.reduce((sum, item) => sum + item.quantity, 0);

      }

      if (totalProductsToRestore === 0) {

        continue;
      }

      // Find the most recent quantity record for this product
      let productQuantity = await prisma.productQuantity.findFirst({
        where: { productId: productId },
        orderBy: { createdAt: 'desc' }
      });

      if (!productQuantity) {

        productQuantity = await prisma.productQuantity.create({
          data: {
            productId: productId,
            date: new Date(),
            quantity: 100
          }
        });

      }

      const updatedQuantity = await prisma.productQuantity.update({
        where: { id: productQuantity.id },
        data: {
          quantity: productQuantity.quantity + totalProductsToRestore,
          updatedAt: new Date()
        }
      });

      quantityRestorations.push({
        productId: productId,
        productName: productName,
        totalProductsRestored: totalProductsToRestore,
        originalQuantity: productQuantity.quantity,
        restoredQuantity: totalProductsToRestore,
        newQuantity: updatedQuantity.quantity,
        menuType: isPackageMenu ? 'Package Menu' : 'Daily Rates'
      });


    }



    return {
      success: true,
      message: 'Product quantities restored successfully',
      restorations: quantityRestorations,
      summary: {
        total: quantityRestorations.length,
        totalProductsRestored: quantityRestorations.reduce((sum, r) => sum + r.restoredQuantity, 0)
      }
    };
  } catch (error) {
    console.error('❌ Error in increaseProductQuantitiesService:', error);
    throw new AppError(`Failed to restore product quantities: ${error.message}`, 500);
  }
};
