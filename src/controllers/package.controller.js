const PackageService = require("../services/package.service");

module.exports = {
  createPackageController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, img_url, user_id } = req.body;

        const result = await PackageService.createPackageService({
          package_name,
          description,
          price,
          img_url,
          user_id,
        });

        return res.status(result.status).json({
          status: result.status,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          status: 500,
          message: error.message || "Lỗi server khi tạo gói",
        });
      }
    }),

  checkPackageAccessController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id } = req.body;
        const { id: package_id } = req.params;

        const result = await PackageService.checkPackageAccessService({
          user_id,
          package_id,
        });

        return res.status(result.status).json({
          status: result.status,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          status: 500,
          message: error.message || "Lỗi server khi kiểm tra quyền sử dụng gói",
        });
      }
    }),

  getAllPackagesController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { searchCondition, pageInfo } = req.body;

        const result = await PackageService.getAllPackagesService({
          searchCondition,
          pageInfo,
        });

        return res.status(result.status).json({
          status: result.status,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({
          status: 500,
          message: error.message || "Lỗi server khi tìm kiếm gói",
        });
      }
    }),
    getPackageByIdController: (req, res) =>
  new Promise(async (resolve, reject) => {
    try {
      const { id: package_id } = req.params;

      const result = await PackageService.getPackageByIdService({ package_id });

      return res.status(result.status).json({
        status: result.status,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        status: 500,
        message: error.message || "Lỗi server khi lấy thông tin gói",
      });
    }
  }),
};