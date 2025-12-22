import prisma from '../config/prisma.js';
import { saveBase64Image } from './imageUpload.service.js';
import { logCritical, logError, logInfo, logTransaction, logPerformance, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Admin Service - Business logic for admin operations and data management
 * Handles all admin-related database operations and business rules
 * Features: Company management, product management, menu management, user management, inventory tracking
 */

export const createCompanyService = async ({ name, address }) => {
  // Check if a company with the same name exists
  const existing = await prisma.company.findFirst({
    where: { name },
  });
  if (existing) {
    return existing;
  }

  // Create a system user ID for company addresses
  // This is a placeholder - in a real system you might want to create a system user
  const systemUserId = '00000000-0000-0000-0000-000000000000';
  
  // First create the address
  const newAddress = await prisma.address.create({
    data: {
      userId: systemUserId,
      street: address.street,
      housename: address.housename || '',
      city: address.city,
      pincode: parseInt(address.pincode),
      geoLocation: address.geoLocation || null,
      addressType: address.addressType || 'HOME'
    }
  });
  
  // Then create the company with the address ID
  const newCompany = await prisma.company.create({
    data: {
      name,
      address_id: newAddress.id,
    }
  });

  // Return company with address details
  return {
    ...newCompany,
    address: newAddress
  };
};

export const companyListService = async () => {
  const companies = await prisma.company.findMany();
  
  // Fetch address details for each company
  const companiesWithAddresses = await Promise.all(
    companies.map(async (company) => {
      try {
        const address = await prisma.address.findUnique({
          where: { id: company.address_id }
        });
        return {
          ...company,
          address: address || null
        };
      } catch (error) {
        console.error(`Error fetching address for company ${company.id}:`, error);
        return {
          ...company,
          address: null
        };
      }
    })
  );
  
  return companiesWithAddresses;
};

export const companyDeleteService = async (id) => {
  return await prisma.company.delete({
    where: { id },
  });
};

export const createProductService = async (productData) => {
  const startTime = Date.now();
  const logContext = {
    productName: productData.productName,
    code: productData.code,
    companyId: productData.companyId,
    category: productData.category?.productCategoryName,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Creating new product', logContext);
    
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
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      try {
        // Create a clean filename: only first 20 characters, alphanumeric and hyphens only
        const cleanProductName = productName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 20); // Take only first 20 characters
        
        const filename = saveBase64Image(imageUrl, `${cleanProductName}-${Date.now()}.jpg`);
        savedImageUrl = `/uploads/${filename}`;
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product image saved successfully', {
          ...logContext,
          filename: filename
        });
      } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Failed to save product image', {
          ...logContext,
          error: error.message
        });
        throw new Error(`Failed to save image: ${error.message}`);
      }
    }

    // Use transaction to ensure all related records are created together
    return await prisma.$transaction(async (tx) => {
      logTransaction('Product Creation Transaction Started', {
        productName,
        code,
        companyId
      });

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

      logInfo(LOG_CATEGORIES.SYSTEM, 'Product created successfully', {
        ...logContext,
        productId: product.id
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product category created', {
          ...logContext,
          productId: product.id,
          categoryName: category.productCategoryName
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product price created', {
          ...logContext,
          productId: product.id,
          price: price[0].price
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product quantity created', {
          ...logContext,
          productId: product.id,
          quantity: quantity[0].quantity
        });
      }

      // Return the created product with all related data
      const completeProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          company: true,
          categories: true,
          prices: true,
          quantities: true,
        },
      });

      const duration = Date.now() - startTime;
      logCritical(LOG_CATEGORIES.SYSTEM, 'Product creation completed successfully', {
        ...logContext,
        productId: product.id,
        duration: `${duration}ms`
      });

      logPerformance('Product Creation', duration, {
        productId: product.id,
        productName: productName
      });

      return completeProduct;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 15000, // 15 second timeout for product creation
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.SYSTEM, 'Product creation failed', {
      ...logContext,
      error: error.message,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    throw error;
  }
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
  const startTime = Date.now();
  const logContext = {
    productId,
    productName: productData.productName,
    code: productData.code,
    companyId: productData.companyId,
    category: productData.category?.productCategoryName,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Updating product', logContext);
    
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
      logTransaction('Product Update Transaction Started', {
        productId,
        productName,
        code
      });

      // Check if product exists
      const existingProduct = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        logError(LOG_CATEGORIES.SYSTEM, 'Product not found for update', logContext);
        throw new Error('Product not found');
      }

      // Check if code is being changed and if it already exists
      if (code !== existingProduct.code) {
        const codeExists = await tx.product.findUnique({
          where: { code }
        });
        if (codeExists) {
          logError(LOG_CATEGORIES.SYSTEM, 'Product code already exists', {
            ...logContext,
            existingCode: existingProduct.code,
            newCode: code
          });
          throw new Error('Product with this code already exists');
        }
      }

      // Check if company exists
      const company = await tx.company.findUnique({
        where: { id: companyId }
      });
      if (!company) {
        logError(LOG_CATEGORIES.SYSTEM, 'Company not found for product update', {
          ...logContext,
          companyId
        });
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

      logInfo(LOG_CATEGORIES.SYSTEM, 'Product updated successfully', {
        ...logContext,
        productId: updatedProduct.id
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product category updated', {
          ...logContext,
          productId: updatedProduct.id,
          categoryName: category.productCategoryName
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product price updated', {
          ...logContext,
          productId: updatedProduct.id,
          price: price[0].price
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
        
        logInfo(LOG_CATEGORIES.SYSTEM, 'Product quantity updated', {
          ...logContext,
          productId: updatedProduct.id,
          quantity: quantity[0].quantity
        });
      }

      // Return the updated product with all related data
      const completeProduct = await tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          company: true,
          categories: true,
          prices: true,
          quantities: true,
        },
      });

      const duration = Date.now() - startTime;
      logCritical(LOG_CATEGORIES.SYSTEM, 'Product update completed successfully', {
        ...logContext,
        productId: updatedProduct.id,
        duration: `${duration}ms`
      });

      logPerformance('Product Update', duration, {
        productId: updatedProduct.id,
        productName: productName
      });

      return completeProduct;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 15000, // 15 second timeout for product update
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.SYSTEM, 'Product update failed', {
      ...logContext,
      error: error.message,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    throw error;
  }
};

export const deleteProductService = async (productId) => {
  const startTime = Date.now();
  const logContext = {
    productId,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Deleting product', logContext);
    
    // Use transaction to ensure all related records are deleted together
    return await prisma.$transaction(async (tx) => {
      logTransaction('Product Deletion Transaction Started', {
        productId
      });

      // Check if product exists
      const existingProduct = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        logError(LOG_CATEGORIES.SYSTEM, 'Product not found for deletion', logContext);
        throw new Error('Product not found');
      }

      logInfo(LOG_CATEGORIES.SYSTEM, 'Product found for deletion', {
        ...logContext,
        productName: existingProduct.productName,
        code: existingProduct.code
      });

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

      logInfo(LOG_CATEGORIES.SYSTEM, 'Product related records deleted', {
        ...logContext,
        productName: existingProduct.productName
      });

      // Delete the product
      const deletedProduct = await tx.product.delete({
        where: { id: productId }
      });

      const duration = Date.now() - startTime;
      logCritical(LOG_CATEGORIES.SYSTEM, 'Product deletion completed successfully', {
        ...logContext,
        productName: deletedProduct.productName,
        code: deletedProduct.code,
        duration: `${duration}ms`
      });

      logPerformance('Product Deletion', duration, {
        productId: productId,
        productName: deletedProduct.productName
      });

      return deletedProduct;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 10000, // 10 second timeout for product deletion
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.SYSTEM, 'Product deletion failed', {
      ...logContext,
      error: error.message,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    throw error;
  }
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
  }, {
    isolationLevel: 'ReadCommitted', // Prevent dirty reads
    timeout: 10000, // 10 second timeout for menu deletion
  });
};

// Menu Item services
export const createMenuItemService = async (menuItemData) => {
  const { name, menuId, productId } = menuItemData;


  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: menuId }
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Check if product exists (if productId is provided)
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }
  }

  // Create the menu item
  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      menuId,
      productId: productId || null, // Store product ID
    },
    include: {
      menu: {
        include: {
          company: true,
        },
      },
      product: true, // Include product relation
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
      product: true, // Include product relation
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
      product: true, // Include product relation
    }
  });
  
  if (!menuItem) {
    throw new Error('Menu item not found');
  }
  
  return menuItem;
};

export const updateMenuItemService = async (menuItemId, menuItemData) => {
  const { name, menuId, productId } = menuItemData;

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

  // Check if product exists (if productId is provided)
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }
  }

  // Update the menu item
  const updatedMenuItem = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      name,
      menuId,
      productId: productId || null, // Store product ID
    },
    include: {
      menu: {
        include: {
          company: true,
        },
      },
      product: true, // Include product relation
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
          product: true, // Include product relation
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
      product: true, // Include product relation
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
      productImage: item.product?.imageUrl || '', // Get product image from relation
      productName: item.product?.productName || '', // Get product name from relation
      productCode: item.product?.code || '', // Get product code from relation
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
      const productName = item.product?.productName?.toLowerCase() || '';
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
          product: true, // Include product relation
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

  // Transform the data to show each menu item as a separate option
  const transformedMenuItems = [];
  
  menus.forEach(menu => {
    const menuItems = menu.menuItems || [];
    const categories = menu.menuCategories || [];
    
    // Create a separate menu item object for each menu item
    menuItems.forEach(item => {
      // Check if this is a comprehensive menu item
      const itemName = item.name?.toLowerCase() || '';
      const productName = item.product?.productName?.toLowerCase() || '';
      const menuName = menu.name?.toLowerCase() || '';
      
      // Define comprehensive menu keywords
      const comprehensiveKeywords = [
        'monthly', 'plan', 'weekly', 'weekday', 'week-day', 'full week', 'comprehensive'
      ];
      
      // Define daily rate keywords
      const dailyRateKeywords = [
        'breakfast', 'lunch', 'dinner', 'meal', 'daily', 'per day', 'single'
      ];
      
      // Check if item is comprehensive (monthly/weekly packages)
      const isComprehensiveItem = comprehensiveKeywords.some(keyword => 
        itemName.includes(keyword) || productName.includes(keyword) || menuName.includes(keyword)
      );
      
      // Check if item is daily rate (individual meals like breakfast)
      const isDailyRateItem = dailyRateKeywords.some(keyword => 
        itemName.includes(keyword) || productName.includes(keyword)
      );
      
      // Determine meal types for this item
      let mealTypes = {
        breakfast: [],
        lunch: [],
        dinner: []
      };
      
      if (isComprehensiveItem) {
        // For comprehensive items, include all meal types
        const comprehensiveItem = {
          ...item,
          isComprehensive: true,
          mealTypes: ['breakfast', 'lunch', 'dinner']
        };
        mealTypes.breakfast.push(comprehensiveItem);
        mealTypes.lunch.push(comprehensiveItem);
        mealTypes.dinner.push(comprehensiveItem);
      } else if (isDailyRateItem) {
        // For daily rate items, determine specific meal type
        if (itemName.includes('breakfast') || productName.includes('breakfast')) {
          mealTypes.breakfast.push(item);
        } else if (itemName.includes('lunch') || productName.includes('lunch')) {
          mealTypes.lunch.push(item);
        } else if (itemName.includes('dinner') || productName.includes('dinner')) {
          mealTypes.dinner.push(item);
        } else {
          // If no specific meal type is mentioned, include in all meal types
          mealTypes.breakfast.push(item);
          mealTypes.lunch.push(item);
          mealTypes.dinner.push(item);
        }
      } else {
        // For other regular items, determine meal type based on name
        if (itemName.includes('breakfast') || productName.includes('breakfast')) {
          mealTypes.breakfast.push(item);
        }
        if (itemName.includes('lunch') || productName.includes('lunch')) {
          mealTypes.lunch.push(item);
        }
        if (itemName.includes('dinner') || productName.includes('dinner')) {
          mealTypes.dinner.push(item);
        }
      }
      
      // Create menu item object
      const menuItemObject = {
        id: item.id, // Use menu item ID as the main ID
        menuId: menu.id, // Keep reference to parent menu
        name: item.name, // Menu item name
        menuName: menu.name, // Parent menu name for reference
        status: menu.status,
        company: menu.company,
        categories: categories,
        mealTypes: mealTypes,
        hasBreakfast: mealTypes.breakfast.length > 0,
        hasLunch: mealTypes.lunch.length > 0,
        hasDinner: mealTypes.dinner.length > 0,
        isComprehensiveMenu: isComprehensiveItem,
        isDailyRateItem: isDailyRateItem,
        // Include the menu item data
        menuItem: item,
        // Include pricing
        price: item.prices && item.prices[0] ? item.prices[0].totalPrice : 0,
        product: item.product
      };
      
      transformedMenuItems.push(menuItemObject);
    });
  });

  return transformedMenuItems;
};

// Admin Order Management Services
export const getAllOrdersService = async (filters) => {
  const { status, startDate, endDate, orderTime, page = 1, limit = 10 } = filters;
  
  const skip = (page - 1) * limit;
  
  // Build where clause
  const where = {};
  
  if (status && status !== 'all' && status !== null) {
    where.status = status;
  }
  
  if (startDate && endDate && startDate !== 'null' && endDate !== 'null' && startDate !== null && endDate !== null) {
    where.orderDate = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  if (orderTime && orderTime !== 'all' && orderTime !== null) {
    where.orderTimes = orderTime;
  }

  // Get orders with pagination (without including problematic relations)
  const orders = await prisma.order.findMany({
    where,
    include: {
      deliveryAddress: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: parseInt(limit)
  });

  // Fetch delivery items separately to avoid relationship issues
  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      try {
        const deliveryItems = await prisma.deliveryItem.findMany({
          where: { 
            orderId: order.id,
            user: {
              isNot: null
            }
          },
          include: {
            user: {
              include: {
                auth: true
              }
            },
            menuItem: {
              include: {
                product: true
              }
            }
          }
        });

        return {
          ...order,
          deliveryItems: deliveryItems
        };
      } catch (error) {
        console.error(`Error fetching delivery items for order ${order.id}:`, error);
        // Return order with empty delivery items if there's an error
        return {
          ...order,
          deliveryItems: []
        };
      }
    })
  );

  // Get total count for pagination
  const totalOrders = await prisma.order.count({ where });
  
  return {
    orders: ordersWithDetails,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      hasNextPage: page * limit < totalOrders,
      hasPrevPage: page > 1
    }
  };
};

export const updateOrderStatusService = async (orderId, status) => {
  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      deliveryAddress: true
    }
  });

  // Fetch delivery items separately
  try {
    const deliveryItems = await prisma.deliveryItem.findMany({
      where: { 
        orderId: orderId,
        user: {
          isNot: null
        }
      },
      include: {
        user: {
          include: {
            auth: true
          }
        },
        menuItem: {
          include: {
            product: true
          }
        }
      }
    });

    const orderWithDetails = {
      ...updatedOrder,
      deliveryItems: deliveryItems
    };

    return orderWithDetails;
  } catch (error) {
    console.error(`Error fetching delivery items for order ${orderId}:`, error);
    // Return order with empty delivery items if there's an error
    return {
      ...updatedOrder,
      deliveryItems: []
    };
  }
};

export const deleteOrderService = async (orderId) => {
  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Use transaction to ensure all related records are deleted together
  return await prisma.$transaction(async (tx) => {
    // Delete delivery items first (due to foreign key constraints)
    await tx.deliveryItem.deleteMany({
      where: { orderId }
    });

    // Delete the order
    const deletedOrder = await tx.order.delete({
      where: { id: orderId }
    });

    return deletedOrder;
  }, {
    isolationLevel: 'ReadCommitted', // Prevent dirty reads
    timeout: 10000, // 10 second timeout for order deletion
  });
};

// Get product quantities for menu items
export const getProductQuantitiesForMenusService = async () => {
  try {
    // Get all menu items with their associated products and quantities
    const menuItemsWithQuantities = await prisma.menuItem.findMany({
      where: {
        productId: {
          not: null
        }
      },
      include: {
        product: {
          include: {
            quantities: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1 // Get the latest quantity
            }
          }
        }
      }
    });

    // Transform the data to return product ID and quantity
    const productQuantities = {};
    menuItemsWithQuantities.forEach(menuItem => {
      if (menuItem.product && menuItem.product.quantities && menuItem.product.quantities.length > 0) {
        productQuantities[menuItem.product.id] = {
          productId: menuItem.product.id,
          productName: menuItem.product.productName,
          quantity: menuItem.product.quantities[0].quantity,
          lastUpdated: menuItem.product.quantities[0].updatedAt
        };
      }
    });

    return productQuantities;
  } catch (error) {
    console.error('Error getting product quantities for menus:', error);
    throw new Error('Failed to get product quantities for menus');
  }
};

// Get all vehicles
export const getVehiclesService = async (filters = {}) => {
  try {
    const { user_id } = filters;
    
    const where = {};
    if (user_id) {
      where.user_id = user_id;
    }
    
    const vehicles = await prisma.vehicles.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return vehicles;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Error fetching vehicles', {
      error: error.message,
      stack: error.stack,
      filters
    });
    throw error;
  }
};

// Assign vehicle to executive
export const assignVehicleToExecutiveService = async (vehicleIdOrNumber, userId) => {
  try {
    // Get the vehicle to get its registration number
    // vehicleIdOrNumber can be either vehicle ID (UUID) or vehicle registration number (string)
    let vehicle = null;
    let vehicleNumber = null;
    
    // Try to find by ID first (UUID format)
    if (vehicleIdOrNumber && vehicleIdOrNumber.length === 36) {
      vehicle = await prisma.vehicles.findUnique({
        where: { id: vehicleIdOrNumber }
      });
      if (vehicle) {
        vehicleNumber = vehicle.registration_number;
      }
    }
    
    // If not found by ID, treat it as registration number
    if (!vehicle) {
      vehicleNumber = vehicleIdOrNumber;
    }
    
    if (!vehicleNumber) {
      throw new Error('Vehicle ID or registration number is required');
    }
    
    // Database updates commented out - only using external API
    // // Update vehicle with user_id
    // const updatedVehicle = await prisma.vehicles.update({
    //   where: { id: vehicleId },
    //   data: { user_id: userId }
    // });
    
    // // Update DeliveryExecutive with vehicle number
    // try {
    //   await prisma.deliveryExecutive.update({
    //     where: { userId: userId },
    //     data: { vehicleNumber: vehicle.registration_number }
    //   });
    // } catch (deliveryExecError) {
    //   // If DeliveryExecutive doesn't exist, log but don't fail
    //   logError(LOG_CATEGORIES.SYSTEM, 'DeliveryExecutive not found for vehicle assignment', {
    //     userId,
    //     error: deliveryExecError.message
    //   });
    //   // Continue - vehicle assignment still succeeds
    // }
    
    // Update external API (primary operation)
    const response = await fetch(`${process.env.AI_ROUTE_API}/api/executives`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mysecretkey123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        vehicle_registration_number: vehicleNumber
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
        logError(LOG_CATEGORIES.SYSTEM, 'External API vehicle assignment failed', {
          userId,
          vehicleIdOrNumber,
          vehicleNumber: vehicleNumber,
          status: response.status,
          error: errorText
        });
      throw new Error(`External API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
        logInfo(LOG_CATEGORIES.SYSTEM, 'External API vehicle assignment succeeded', {
          userId,
          vehicleIdOrNumber,
          vehicleNumber: vehicleNumber,
          response: data
        });
    
    // Return the API response
    return {
      success: true,
      message: data.message || 'Vehicle assigned to executive successfully',
      data: data,
      vehicle: {
        registration_number: vehicleNumber
      }
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Error assigning vehicle to executive', {
      error: error.message,
      stack: error.stack,
      vehicleIdOrNumber,
      userId
    });
    throw error;
  }
};

// Unassign vehicle from executive
export const unassignVehicleFromExecutiveService = async (vehicleIdOrNumber, userId) => {
  try {
    // Get user_id from parameter (required for unassignment)
    const executiveUserId = userId;
    
    if (!executiveUserId) {
      throw new Error('User ID is required for vehicle unassignment');
    }
    
    // Database lookup commented out - not needed for unassignment
    // const vehicle = await prisma.vehicles.findUnique({
    //   where: { id: vehicleIdOrNumber }
    // });
    
    // Database updates commented out - only using external API
    // const previousUserId = vehicle.user_id;
    
    // // Update vehicle to remove user_id
    // const updatedVehicle = await prisma.vehicles.update({
    //   where: { id: vehicleId },
    //   data: { user_id: null }
    // });
    
    // // Clear vehicleNumber from DeliveryExecutive if user_id existed
    // if (previousUserId) {
    //   try {
    //     await prisma.deliveryExecutive.update({
    //       where: { userId: previousUserId },
    //       data: { vehicleNumber: null }
    //     });
    //   } catch (deliveryExecError) {
    //     // If DeliveryExecutive doesn't exist, log but don't fail
    //     logError(LOG_CATEGORIES.SYSTEM, 'DeliveryExecutive not found for vehicle unassignment', {
    //       userId: previousUserId,
    //       error: deliveryExecError.message
    //     });
    //     // Continue - vehicle unassignment still succeeds
    //   }
    // }
    
    // Update external API (primary operation)
    // For unassignment, set vehicle_registration_number to null or empty string
    const response = await fetch(`${process.env.AI_ROUTE_API}/api/executives`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mysecretkey123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: executiveUserId,
        vehicle_registration_number: null // Set to null for unassignment
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
        logError(LOG_CATEGORIES.SYSTEM, 'External API vehicle unassignment failed', {
          userId: executiveUserId,
          vehicleIdOrNumber,
          status: response.status,
          error: errorText
        });
      throw new Error(`External API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
        logInfo(LOG_CATEGORIES.SYSTEM, 'External API vehicle unassignment succeeded', {
          userId: executiveUserId,
          vehicleIdOrNumber,
          response: data
        });
    
    // Return the API response
    return {
      success: true,
      message: data.message || 'Vehicle unassigned from executive successfully',
      data: data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Error unassigning vehicle from executive', {
      error: error.message,
      stack: error.stack,
      vehicleIdOrNumber,
      userId
    });
    throw error;
  }
};

