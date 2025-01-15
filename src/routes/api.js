// const AuthRoute = require("./auth.route");
// const UserRoute = require("./user.route");
const CheckApi = require("./checkapi.route");
const FoodRoute = require("./food.route");
const CartRoute = require("./cart.route");
const Payment = require("./payment.route");
const Ipin = require("./ipin.route");
const VnPay = require("./vnpay.route");


const initRoute = (app) => {
  app.use("", CheckApi);
  app.use("/v1/api", FoodRoute);
  app.use("/v1/api", CartRoute);
  app.use("/api", Payment);
  app.use("", Ipin);
  app.use("/v1/api", VnPay);
};

module.exports = initRoute;
