class IService {
  create() {
    throw new Error("IService.create must be implemented");
  }

  getById() {
    throw new Error("IService.getById must be implemented");
  }

  list() {
    throw new Error("IService.list must be implemented");
  }

  update() {
    throw new Error("IService.update must be implemented");
  }

  delete() {
    throw new Error("IService.delete must be implemented");
  }
}

module.exports = IService;
