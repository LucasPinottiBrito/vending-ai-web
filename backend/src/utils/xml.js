const { create } = require("xmlbuilder2");

function buildXml(rootName, data) {
  return create({ version: "1.0", encoding: "UTF-8" })
    .ele({ [rootName]: data })
    .end({ prettyPrint: true });
}

module.exports = {
  buildXml,
};
