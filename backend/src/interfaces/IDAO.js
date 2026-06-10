class IDAO {
  create() {
    throw new Error("IDAO.create must be implemented");
  }

  findById() {
    throw new Error("IDAO.findById must be implemented");
  }

  findAll() {
    throw new Error("IDAO.findAll must be implemented");
  }

  update() {
    throw new Error("IDAO.update must be implemented");
  }

  delete() {
    throw new Error("IDAO.delete must be implemented");
  }
}

module.exports = IDAO;
