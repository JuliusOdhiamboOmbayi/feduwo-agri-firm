const app = require("../server/server");

module.exports = app;
module.exports.config = {
  api: { bodyParser: false },
  maxDuration: 30,
};
