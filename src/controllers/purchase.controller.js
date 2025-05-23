const PurchaseService = require("../services/purchase.service");

module.exports = {
  createPurchaseController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, package_id } = req.body;

        const result = await PurchaseService.createPurchaseService({
          user_id,
          package_id,
        });

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tạo giao dịch mua",
        });
      }
    }),

  searchPurchasesController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { searchCondition = {}, pageInfo = {} } = req.body;

        const result = await PurchaseService.searchPurchasesService(req, searchCondition, pageInfo);

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi tìm kiếm giao dịch mua",
        });
      }
    }),

  checkPurchaseController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, package_id } = req.body;

        const result = await PurchaseService.checkPurchaseService(user_id, package_id);

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi kiểm tra giao dịch mua",
        });
      }
    }),

  upgradePremiumController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_id } = req.body;
        const user_id = req.user._id;

        const result = await PurchaseService.upgradePremiumService(user_id, package_id);

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi nâng cấp role Premium",
        });
      }
    }),

  completePurchaseController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { purchase_id } = req.body;
        const user_id = req.user._id;

        const result = await PurchaseService.completePurchaseService(user_id, purchase_id);

        return res.status(result.status).json(result);
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          ok: false,
          message: error.message || "Lỗi server khi hoàn tất giao dịch",
        });
      }
    }),
};