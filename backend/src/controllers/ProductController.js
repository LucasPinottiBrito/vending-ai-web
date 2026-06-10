const IController = require("../interfaces/IController");
const ProductService = require("../services/ProductService");
const { sendSuccess } = require("../utils/response");

class ProductController extends IController {
  constructor(productService = new ProductService()) {
    super();
    this.productService = productService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
  }

  async create(req, res, next) {
    try {
      const product = await this.productService.create(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { product }, "Product created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await this.productService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { product }, "Product found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const products = await this.productService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { products }, "Products listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await this.productService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { product }, "Product updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const product = await this.productService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { product }, "Product deactivated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async uploadImage(req, res, next) {
    try {
      const product = await this.productService.updateImage(
        req.params.id,
        req.file,
        this.buildContext(req),
      );
      return sendSuccess(res, { product }, "Product image uploaded successfully");
    } catch (error) {
      return next(error);
    }
  }

  buildContext(req, statusCode = 200) {
    return {
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip,
      user_agent: req.get("user-agent") || null,
      user: req.user || null,
      status_code: statusCode,
    };
  }
}

module.exports = ProductController;
