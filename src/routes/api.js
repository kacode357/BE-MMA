
const CategoryRoute = require("./category.route");
const FoodRoute = require("./food.route");
const Oder = require("./order.route");
const CheckApi = require("./checkup.route");
const Payment = require("./payment.route");

const initRoute = (app) => {
  app.use("", CheckApi);

  app.use("/v1/api", CategoryRoute);
  app.use("/v1/api", FoodRoute);
  app.use("/v1/api", Oder);
  app.use("/v1/api", Payment);

};

module.exports = initRoute;
