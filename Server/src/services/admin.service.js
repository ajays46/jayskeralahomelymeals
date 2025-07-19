import prisma from '../config/prisma.js';

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

  // Use transaction to ensure all related records are created together
  return await prisma.$transaction(async (tx) => {
    // 1. Create the product
    const product = await tx.product.create({
      data: {
        productName,
        code,
        imageUrl,
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

// New service for booking page - fetch products by meal category
export const getProductsByMealCategoryService = async (mealCategory) => {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      categories: {
        some: {
          productCategoryName: {
            contains: mealCategory,
            mode: 'insensitive'
          }
        }
      }
    },
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
  
  // Transform the data to match the booking page format
  return products.map(product => ({
    id: product.id,
    image: product.imageUrl,
    product_name: product.productName,
    malayalam_name: product.categories[0]?.description || '',
    price: product.prices[0]?.price || 0,
    category: product.categories[0]?.productCategoryName || '',
    description: product.categories[0]?.description || '',
    code: product.code,
    company: product.company?.name || '',
    status: product.status,
    quantity: product.quantities[0]?.quantity || 0
  }));
};

// Service to get all active products for booking page
export const getAllActiveProductsService = async () => {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      company: true,
      categories: true,
      prices: {
        orderBy: {
          date: 'desc'
        },
        take: 1
      },
      quantities: {
        orderBy: {
          date: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // Transform and categorize the data
  const categorizedProducts = {
    breakfast: [],
    lunch: [],
    dinner: []
  };
  
  products.forEach(product => {
    const transformedProduct = {
      id: product.id,
      image: product.imageUrl,
      product_name: product.productName,
      malayalam_name: product.categories[0]?.description || '',
      price: product.prices[0]?.price || 0,
      category: product.categories[0]?.productCategoryName || '',
      description: product.categories[0]?.description || '',
      code: product.code,
      company: product.company?.name || '',
      status: product.status,
      quantity: product.quantities[0]?.quantity || 0
    };
    
    // Categorize based on category name
    const categoryName = product.categories[0]?.productCategoryName?.toLowerCase() || '';
    if (categoryName.includes('breakfast')) {
      categorizedProducts.breakfast.push(transformedProduct);
    } else if (categoryName.includes('lunch')) {
      categorizedProducts.lunch.push(transformedProduct);
    } else if (categoryName.includes('dinner')) {
      categorizedProducts.dinner.push(transformedProduct);
    }
  });
  
  return categorizedProducts;
};

// New service to get menu items by date (day of week)
export const getMenuItemsByDateService = async (selectedDate) => {
  // Convert date to day of week
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  // Get menus for the specific day of week
  const menus = await prisma.menu.findMany({
    where: {
      dayOfWeek: dayOfWeek,
      status: 'ACTIVE'
    },
    include: {
      company: true,
      menuItems: {
        include: {
          product: {
            include: {
              company: true,
              categories: true,
              prices: {
                orderBy: {
                  date: 'desc'
                },
                take: 1
              },
              quantities: {
                orderBy: {
                  date: 'desc'
                },
                take: 1
              }
            }
          }
        }
      }
    }
  });
  
  // Transform and categorize the data
  const categorizedMenuItems = {
    breakfast: [],
    lunch: [],
    dinner: []
  };
  
  menus.forEach(menu => {
    menu.menuItems.forEach(menuItem => {
      const product = menuItem.product;
      
      // Only include active products
      if (product.status === 'ACTIVE') {
        const transformedProduct = {
          id: product.id,
          image: product.imageUrl,
          product_name: product.productName,
          malayalam_name: product.categories[0]?.description || '',
          price: product.prices[0]?.price || 0,
          category: product.categories[0]?.productCategoryName || '',
          description: product.categories[0]?.description || '',
          code: product.code,
          company: product.company?.name || '',
          status: product.status,
          quantity: product.quantities[0]?.quantity || 0,
          menuItemId: menuItem.id,
          menuName: menu.name,
          dayOfWeek: menu.dayOfWeek
        };
        
        // Categorize based on category name
        const categoryName = product.categories[0]?.productCategoryName?.toLowerCase() || '';
        if (categoryName.includes('breakfast')) {
          categorizedMenuItems.breakfast.push(transformedProduct);
        } else if (categoryName.includes('lunch')) {
          categorizedMenuItems.lunch.push(transformedProduct);
        } else if (categoryName.includes('dinner')) {
          categorizedMenuItems.dinner.push(transformedProduct);
        }
      }
    });
  });
  
  return {
    dayOfWeek,
    date: selectedDate,
    menuItems: categorizedMenuItems
  };
};

// Menu services
export const createMenuService = async (menuData) => {
  const { name, companyId, dayOfWeek, status } = menuData;

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
      dayOfWeek,
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
          product: true,
        },
      },
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
          product: true,
        },
      },
    }
  });
  
  if (!menu) {
    throw new Error('Menu not found');
  }
  
  return menu;
};

export const updateMenuService = async (menuId, menuData) => {
  const { name, companyId, dayOfWeek, status } = menuData;

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
      dayOfWeek,
      status,
    },
    include: {
      company: true,
      menuItems: {
        include: {
          product: true,
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
  const { name, productId, menuId } = menuItemData;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error('Product not found');
  }

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
      productId,
      menuId,
    },
    include: {
      product: true,
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
      product: true,
      menu: {
        include: {
          company: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return menuItems;
};

