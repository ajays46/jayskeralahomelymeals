import prisma from '../config/prisma.js';
import { saveBase64Image } from './imageUpload.service.js';

export const createCompanyService = async ({ name, address_id }) => {
  // Check if a company with the same name exists
  const existing = await prisma.company.findFirst({
    where: { name },
  });
  if (existing) {
    return existing;
  }
  // If not, create a new company
  return await prisma.company.create({
    data: {
      name,
      address_id,
    },
  });
};

export const companyListService = async () => {
 const companies = await prisma.company.findMany();
 return companies;
};

export const companyDeleteService = async (id) => {
  return await prisma.company.delete({
    where: { id },
  });
};

export const createProductService = async (productData) => {
  console.log('=== CREATE PRODUCT SERVICE CALLED ===');
  console.log('Product data received:', {
    productName: productData.productName,
    code: productData.code,
    hasImage: !!productData.imageUrl,
    imageUrlLength: productData.imageUrl ? productData.imageUrl.length : 0,
    companyId: productData.companyId,
    status: productData.status
  });
  
  const {
    productName,
    code,
    imageUrl,
    companyId,
    status,
    category,
    price,
    quantity
  } = productData;

  // Save image to uploads folder if it's a base64 string
  let savedImageUrl = imageUrl;
  console.log('Processing image:', imageUrl ? 'Image provided' : 'No image');
  if (imageUrl && imageUrl.startsWith('data:image/')) {
    try {
      console.log('Saving base64 image to uploads folder...');
      // Create a clean filename: only first 20 characters, alphanumeric and hyphens only
      const cleanProductName = productName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 20); // Take only first 20 characters
      
      const filename = saveBase64Image(imageUrl, `${cleanProductName}-${Date.now()}.jpg`);
      savedImageUrl = `/uploads/${filename}`;
      console.log('Image saved successfully:', filename);
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error(`Failed to save image: ${error.message}`);
    }
  } else {
    console.log('No base64 image to save, using original imageUrl');
  }

  // Use transaction to ensure all related records are created together
  return await prisma.$transaction(async (tx) => {
    // 1. Create the product
    const product = await tx.product.create({
      data: {
        productName,
        code,
        imageUrl: savedImageUrl,
        companyId,
        status,
      },
    });

    // 2. Create product category
    if (category && category.productCategoryName) {
      await tx.productCategory.create({
        data: {
          companyId,
          productId: product.id,
          productCategoryName: category.productCategoryName,
          description: category.description || '',
        },
      });
    }

    // 3. Create product price
    if (price && price.length > 0) {
      await tx.productPrice.create({
        data: {
          date: new Date(price[0].date),
          productId: product.id,
          price: price[0].price,
        },
      });
    }

    // 4. Create product quantity
    if (quantity && quantity.length > 0) {
      await tx.productQuantity.create({
        data: {
          date: new Date(quantity[0].date),
          productId: product.id,
          quantity: quantity[0].quantity,
        },
      });
    }

    // Return the created product with all related data
    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        company: true,
        categories: true,
        prices: true,
        quantities: true,
      },
    });
  });
};

export const productListService = async () => {
  const products = await prisma.product.findMany({
    include: {
      company: true,
      categories: true,
      prices: {
        orderBy: {
          date: 'desc'
        },
        take: 1 // Get only the latest price
      },
      quantities: {
        orderBy: {
          date: 'desc'
        },
        take: 1 // Get only the latest quantity
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return products;
};

export const getProductByIdService = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      company: true,
      categories: true,
      prices: {
        orderBy: {
          date: 'desc'
        }
      },
      quantities: {
        orderBy: {
          date: 'desc'
        }
      }
    }
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
};

export const updateProductService = async (productId, productData) => {
  const {
    productName,
    code,
    imageUrl,
    companyId,
    status,
    category,
    price,
    quantity
  } = productData;

  // Use transaction to ensure all related records are updated together
  return await prisma.$transaction(async (tx) => {
    // Check if product exists
    const existingProduct = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Check if code is being changed and if it already exists
    if (code !== existingProduct.code) {
      const codeExists = await tx.product.findUnique({
        where: { code }
      });
      if (codeExists) {
        throw new Error('Product with this code already exists');
      }
    }

    // Check if company exists
    const company = await tx.company.findUnique({
      where: { id: companyId }
    });
    if (!company) {
      throw new Error('Company not found');
    }

    // 1. Update the product
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        productName,
        code,
        imageUrl,
        companyId,
        status,
      },
    });

    // 2. Update product category (delete existing and create new)
    await tx.productCategory.deleteMany({
      where: { productId }
    });

    if (category && category.productCategoryName) {
      await tx.productCategory.create({
        data: {
          companyId,
          productId: updatedProduct.id,
          productCategoryName: category.productCategoryName,
          description: category.description || '',
        },
      });
    }

    // 3. Update product price (delete existing and create new)
    await tx.productPrice.deleteMany({
      where: { productId }
    });

    if (price && price.length > 0) {
      await tx.productPrice.create({
        data: {
          date: new Date(price[0].date),
          productId: updatedProduct.id,
          price: price[0].price,
        },
      });
    }

    // 4. Update product quantity (delete existing and create new)
    await tx.productQuantity.deleteMany({
      where: { productId }
    });

    if (quantity && quantity.length > 0) {
      await tx.productQuantity.create({
        data: {
          date: new Date(quantity[0].date),
          productId: updatedProduct.id,
          quantity: quantity[0].quantity,
        },
      });
    }

    // Return the updated product with all related data
    return await tx.product.findUnique({
      where: { id: updatedProduct.id },
      include: {
        company: true,
        categories: true,
        prices: true,
        quantities: true,
      },
    });
  });
};

export const deleteProductService = async (productId) => {
  // Use transaction to ensure all related records are deleted together
  return await prisma.$transaction(async (tx) => {
    // Check if product exists
    const existingProduct = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Delete related records first (due to foreign key constraints)
    await tx.productCategory.deleteMany({
      where: { productId }
    });

    await tx.productPrice.deleteMany({
      where: { productId }
    });

    await tx.productQuantity.deleteMany({
      where: { productId }
    });

    // Delete the product
    const deletedProduct = await tx.product.delete({
      where: { id: productId }
    });

    return deletedProduct;
  });
};

// Menu services
export const createMenuService = async (menuData) => {
  const { name, companyId, status } = menuData;

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Create the menu
  const menu = await prisma.menu.create({
    data: {
      name,
      companyId,
      status,
    },
    include: {
      company: true,
      menuItems: true,
    },
  });

  return menu;
};

export const menuListService = async () => {
  const menus = await prisma.menu.findMany({
    include: {
      company: true,
      menuItems: {
        include: {
          // product relation removed since we removed productId
        },
      },
      menuCategories: true, // Include menu categories to get food type info
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return menus;
};

export const getMenuByIdService = async (menuId) => {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    include: {
      company: true,
      menuItems: {
        include: {
          // product relation removed since we removed productId
        },
      },
      menuCategories: true, // Include menu categories to get food type info
    }
  });
  
  if (!menu) {
    throw new Error('Menu not found');
  }
  
  return menu;
};

export const updateMenuService = async (menuId, menuData) => {
  const { name, companyId, status } = menuData;

  // Check if menu exists
  const existingMenu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!existingMenu) {
    throw new Error('Menu not found');
  }

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Update the menu
  const updatedMenu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      name,
      companyId,
      status,
    },
    include: {
      company: true,
      menuItems: {
        include: {
          // product relation removed since we removed productId
        },
      },
    },
  });

  return updatedMenu;
};

export const deleteMenuService = async (menuId) => {
  // Check if menu exists
  const existingMenu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!existingMenu) {
    throw new Error('Menu not found');
  }

  // Use transaction to ensure all related records are deleted together
  return await prisma.$transaction(async (tx) => {
    // Delete menu items first (due to foreign key constraints)
    await tx.menuItem.deleteMany({
      where: { menuId }
    });

    // Delete the menu
    const deletedMenu = await tx.menu.delete({
      where: { id: menuId }
    });

    return deletedMenu;
  });
};

// Menu Item services
export const createMenuItemService = async (menuItemData) => {
  const { name, menuId, productName, mealType } = menuItemData;
  console.log(menuItemData,'menuItemData');

  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Create the menu item
  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      menuId,
      productName: productName || null, // Store product name directly
      // Note: mealType is not stored in the database, it's just used for validation/processing
    },
    include: {
      menu: {
        include: {
          company: true,
        },
      },
    },
  });

  return menuItem;
};

export const menuItemListService = async () => {
  const menuItems = await prisma.menuItem.findMany({
    include: {
      menu: {
        include: {
          company: true,
          menuCategories: true,
        },
      },
      // product relation removed since we removed productId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return menuItems;
};

export const getMenuItemByIdService = async (menuItemId) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      menu: {
        include: {
          company: true,
          menuCategories: true,
        },
      },
      // product relation removed since we removed productId
    }
  });
  
  if (!menuItem) {
    throw new Error('Menu item not found');
  }
  
  return menuItem;
};

export const updateMenuItemService = async (menuItemId, menuItemData) => {
  const { name, menuId, productName, mealType } = menuItemData;

  // Check if menu item exists
  const existingMenuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId }
  });

  if (!existingMenuItem) {
    throw new Error('Menu item not found');
  }

  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Update the menu item
  const updatedMenuItem = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      name,
      menuId,
      productName: productName || null, // Store product name directly
      // Note: mealType is not stored in the database, it's just used for validation/processing
    },
    include: {
      menu: {
        include: {
          company: true,
        },
      },
    },
  });

  return updatedMenuItem;
};

export const deleteMenuItemService = async (menuItemId) => {
  // Check if menu item exists
  const existingMenuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId }
  });

  if (!existingMenuItem) {
    throw new Error('Menu item not found');
  }

  // Delete the menu item
  const deletedMenuItem = await prisma.menuItem.delete({
    where: { id: menuItemId },
    include: {
      menu: {
        include: {
          company: true,
        },
      },
    },
  });

  return deletedMenuItem;
};

// Menu Category services
export const createMenuCategoryService = async (menuCategoryData) => {
  const { name, description, companyId, menuId } = menuCategoryData;

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Create the menu category
  const menuCategory = await prisma.menuCategory.create({
    data: {
      name,
      description,
      companyId,
      menuId,
    },
    include: {
      company: true,
      menu: true,
    },
  });

  return menuCategory;
};

export const menuCategoryListService = async () => {
  const menuCategories = await prisma.menuCategory.findMany({
    include: {
      company: true,
      menu: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return menuCategories;
};

export const getMenuCategoryByIdService = async (menuCategoryId) => {
  const menuCategory = await prisma.menuCategory.findUnique({
    where: { id: menuCategoryId },
    include: {
      company: true,
      menu: true,
    }
  });
  
  if (!menuCategory) {
    throw new Error('Menu category not found');
  }
  
  return menuCategory;
};

export const updateMenuCategoryService = async (menuCategoryId, menuCategoryData) => {
  const { name, description, companyId, menuId } = menuCategoryData;

  // Check if menu category exists
  const existingMenuCategory = await prisma.menuCategory.findUnique({
    where: { id: menuCategoryId }
  });

  if (!existingMenuCategory) {
    throw new Error('Menu category not found');
  }

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Update the menu category
  const updatedMenuCategory = await prisma.menuCategory.update({
    where: { id: menuCategoryId },
    data: {
      name,
      description,
      companyId,
      menuId,
    },
    include: {
      company: true,
      menu: true,
    },
  });

  return updatedMenuCategory;
};

export const deleteMenuCategoryService = async (menuCategoryId) => {
  // Check if menu category exists
  const existingMenuCategory = await prisma.menuCategory.findUnique({
    where: { id: menuCategoryId }
  });

  if (!existingMenuCategory) {
    throw new Error('Menu category not found');
  }

  // Delete the menu category
  const deletedMenuCategory = await prisma.menuCategory.delete({
    where: { id: menuCategoryId },
    include: {
      company: true,
      menu: true,
    },
  });

  return deletedMenuCategory;
};

// Menu Item Price services
export const createMenuItemPriceService = async (menuItemPriceData) => {
  const { companyId, menuItemId, totalPrice } = menuItemPriceData;

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Check if menu item exists
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId }
  });

  if (!menuItem) {
    throw new Error('Menu item not found');
  }

  // Create the menu item price
  const menuItemPrice = await prisma.menuItemPrice.create({
    data: {
      companyId,
      menuItemId,
      totalPrice,
    },
    include: {
      company: true,
      menuItem: {
        include: {
          // product relation removed since we removed productId
          menu: true,
        },
      },
    },
  });

  return menuItemPrice;
};

export const menuItemPriceListService = async () => {
  const menuItemPrices = await prisma.menuItemPrice.findMany({
    include: {
      company: true,
      menuItem: {
        include: {
          // product relation removed since we removed productId
          menu: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return menuItemPrices;
};

export const getMenuItemPriceByIdService = async (menuItemPriceId) => {
  const menuItemPrice = await prisma.menuItemPrice.findUnique({
    where: { id: menuItemPriceId },
    include: {
      company: true,
      menuItem: {
        include: {
          // product relation removed since we removed productId
          menu: true,
        },
      },
    }
  });
  
  if (!menuItemPrice) {
    throw new Error('Menu item price not found');
  }
  
  return menuItemPrice;
};

export const updateMenuItemPriceService = async (menuItemPriceId, menuItemPriceData) => {
  const { companyId, menuItemId, totalPrice } = menuItemPriceData;

  // Check if menu item price exists
  const existingMenuItemPrice = await prisma.menuItemPrice.findUnique({
    where: { id: menuItemPriceId }
  });

  if (!existingMenuItemPrice) {
    throw new Error('Menu item price not found');
  }

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Check if menu item exists
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId }
  });

  if (!menuItem) {
    throw new Error('Menu item not found');
  }

  // Update the menu item price
  const updatedMenuItemPrice = await prisma.menuItemPrice.update({
    where: { id: menuItemPriceId },
    data: {
      companyId,
      menuItemId,
      totalPrice,
    },
    include: {
      company: true,
      menuItem: {
        include: {
          // product relation removed since we removed productId
          menu: true,
        },
      },
    },
  });

  return updatedMenuItemPrice;
};

export const deleteMenuItemPriceService = async (menuItemPriceId) => {
  // Check if menu item price exists
  const existingMenuItemPrice = await prisma.menuItemPrice.findUnique({
    where: { id: menuItemPriceId }
  });

  if (!existingMenuItemPrice) {
    throw new Error('Menu item price not found');
  }

  // Delete the menu item price
  const deletedMenuItemPrice = await prisma.menuItemPrice.delete({
    where: { id: menuItemPriceId },
    include: {
      company: true,
      menuItem: {
        include: {
          // product relation removed since we removed productId
          menu: true,
        },
      },
    },
  });

  return deletedMenuItemPrice;
};

// Get meals by day of the week
export const getMealsByDayService = async (dayOfWeek) => {
  // Convert day to proper format (e.g., "Monday" to "MONDAY")
  const formattedDay = dayOfWeek.toUpperCase();
  
  // Get all menu items that start with the day name (case insensitive)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      OR: [
        {
          name: {
            startsWith: dayOfWeek
          }
        },
        {
          name: {
            startsWith: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
          }
        },
        {
          name: {
            startsWith: dayOfWeek.toUpperCase()
          }
        }
      ]
    },
    include: {
      // product relation removed since we removed productId
      menu: {
        include: {
          menuCategories: true
        }
      },
      prices: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get the latest price
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Categorize items into breakfast, lunch, dinner
  const categorizedMeals = {
    breakfast: [],
    lunch: [],
    dinner: []
  };

  menuItems.forEach(item => {
    // Compute food type from menu categories
    let foodType = 'VEG'; // Default
    if (item.menu && item.menu.menuCategories) {
      const categoryNames = item.menu.menuCategories.map(cat => cat.name.toLowerCase());
      if (categoryNames.some(name => name.includes('non') || name.includes('non-veg'))) {
        foodType = 'NON_VEG';
      }
    }

    const mealData = {
      id: item.id,
      name: item.name,
      price: item.prices[0]?.totalPrice || 0,
      productImage: '', // No product image since we removed product relation
      productName: item.productName || '', // Use productName field directly
      productCode: '', // No product code since we removed product relation
      menuName: item.menu?.name || '',
      foodType: foodType // Computed from menu categories
    };

    // Determine category based on item name
    const itemName = item.name.toLowerCase();
    if (itemName.includes('breakfast')) {
      categorizedMeals.breakfast.push(mealData);
    } else if (itemName.includes('lunch')) {
      categorizedMeals.lunch.push(mealData);
    } else if (itemName.includes('dinner')) {
      categorizedMeals.dinner.push(mealData);
    } else {
      // If no specific meal type is mentioned, categorize based on product or menu
      // You can customize this logic based on your needs
      const productName = item.productName?.toLowerCase() || '';
      const menuName = item.menu?.name?.toLowerCase() || '';
      
      // Default categorization logic - you can modify this
      if (productName.includes('breakfast') || menuName.includes('breakfast')) {
        categorizedMeals.breakfast.push(mealData);
      } else if (productName.includes('lunch') || menuName.includes('lunch')) {
        categorizedMeals.lunch.push(mealData);
      } else if (productName.includes('dinner') || menuName.includes('dinner')) {
        categorizedMeals.dinner.push(mealData);
      } else {
        // If still no match, put in breakfast by default (or you can create an "other" category)
        categorizedMeals.breakfast.push(mealData);
      }
    }
  });

  return {
    day: dayOfWeek,
    meals: categorizedMeals
  };
};

// Get menus with categories and menu items for booking page
export const getMenusForBookingService = async () => {
  const menus = await prisma.menu.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      company: true,
      menuCategories: true,
      menuItems: {
        include: {
          prices: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1 // Get the latest price
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Transform the data to group menu items by meal type
  const transformedMenus = menus.map(menu => {
    const menuItems = menu.menuItems || [];
    
    // Group menu items by meal type (productName)
    const mealTypes = {
      breakfast: menuItems.filter(item => item.productName === 'breakfast'),
      lunch: menuItems.filter(item => item.productName === 'lunch'),
      dinner: menuItems.filter(item => item.productName === 'dinner')
    };

    // Get categories
    const categories = menu.menuCategories || [];

    return {
      id: menu.id,
      name: menu.name,
      dayOfWeek: menu.dayOfWeek,
      status: menu.status,
      company: menu.company,
      categories: categories,
      mealTypes: mealTypes,
      hasBreakfast: mealTypes.breakfast.length > 0,
      hasLunch: mealTypes.lunch.length > 0,
      hasDinner: mealTypes.dinner.length > 0
    };
  });

  return transformedMenus;
};

