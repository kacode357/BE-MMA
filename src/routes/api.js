const AuthRoute = require("./auth.route");
const UserRoute = require("./user.route");
const GroupRoute = require("./group.route");
const FoodRoute = require("./food.route");
const CartRoute = require("./cart.route");
const Payment = require("./payment.route");
const VnPay = require("./vnpay.route");


const initRoute = (app) => {
  app.use("/v1/api", AuthRoute);
  app.use("/v1/api", UserRoute);
  app.use("/v1/api", GroupRoute);
  app.use("/v1/api", FoodRoute);
  app.use("/v1/api", CartRoute);
  app.use("/v1/api", Payment);
  app.use("/v1/api", VnPay);
};

module.exports = initRoute;
