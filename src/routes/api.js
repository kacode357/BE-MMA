const UserRoute = require("./user.route");
const CategoryRoute = require("./category.route");
const FoodRoute = require("./food.route");
const Oder = require("./order.route");

const initRoute = (app) => {
  app.use("/v1/api", UserRoute);
  app.use("/v1/api", CategoryRoute);
  app.use("/v1/api", FoodRoute);
  app.use("/v1/api", Oder);
};

module.exports = initRoute;
