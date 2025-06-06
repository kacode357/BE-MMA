const CheckApi = require("./checkup.route");
const UserRoute = require("./user.route");
const PackageRoute = require("./package.route");
const PurchaseRoute = require("./purchase.route");
const PaymentRoute = require("./payment.route");
const GroupRoute = require("./group.route");
const GroupMemberRoute = require("./groupMember.route");
const ChatHistory = require("./chatHistory.route");
const ChatSession = require("./chatSession.route");

const initRoute = (app) => {
  app.use("", CheckApi);
  app.use("/v1/api", UserRoute);
  app.use("/v1/api", PackageRoute);
  app.use("/v1/api", PurchaseRoute);
  app.use("/v1/api", PaymentRoute);
  app.use("/v1/api", GroupRoute);
  app.use("/v1/api", GroupMemberRoute);
  app.use("/v1/api", ChatHistory);
  app.use("/v1/api", ChatSession);

};

module.exports = initRoute;