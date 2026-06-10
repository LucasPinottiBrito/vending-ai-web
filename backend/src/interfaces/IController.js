class IController {
  create() {
    throw new Error("IController.create must be implemented");
  }

  getById() {
    throw new Error("IController.getById must be implemented");
  }

  list() {
    throw new Error("IController.list must be implemented");
  }

  update() {
    throw new Error("IController.update must be implemented");
  }

  delete() {
    throw new Error("IController.delete must be implemented");
  }
}

module.exports = IController;
