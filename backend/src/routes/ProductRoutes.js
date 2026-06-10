const { Router } = require("express");

const ProductController = require("../controllers/ProductController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { productImageUpload } = require("../utils/fileUpload");
const {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productListQuerySchema,
} = require("../validators/productValidator");

class ProductRoutes {
  constructor(productController = new ProductController()) {
    this.router = Router();
    this.productController = productController;
    this.register();
  }

  register() {
    this.router.get(
      "/products",
      validate({ query: productListQuerySchema }),
      this.productController.list,
    );
    this.router.get(
      "/products/:id",
      validate({ params: productIdParamSchema }),
      this.productController.getById,
    );
    this.router.post(
      "/products",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ body: createProductSchema }),
      this.productController.create,
    );
    this.router.put(
      "/products/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: productIdParamSchema, body: updateProductSchema }),
      this.productController.update,
    );
    this.router.delete(
      "/products/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: productIdParamSchema }),
      this.productController.delete,
    );
    this.router.post(
      "/products/:id/image",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: productIdParamSchema }),
      productImageUpload.single("image"),
      this.productController.uploadImage,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ProductRoutes;
