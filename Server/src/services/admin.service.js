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
//  console.log(companies);
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

