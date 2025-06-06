const PackageService = require("../services/package.service");

module.exports = {
  createPackageController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, img_url, user_id, is_premium, ai_model, supported_features } = req.body;

        const result = await PackageService.createPackageService({
          package_name,
          description,
          price,
          img_url,
          user_id,
          is_premium,
          ai_model,
          supported_features,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in createPackageController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi tạo gói",
        });
      }
    }),

  checkPackageAccessController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, requested_feature } = req.body;
        const { id: package_id } = req.params;

        const result = await PackageService.checkPackageAccessService({
          user_id,
          package_id,
          requested_feature,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in checkPackageAccessController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi kiểm tra quyền sử dụng gói",
        });
      }
    }),

  getAllPackagesController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { searchCondition = {}, pageInfo = {} } = req.body;

        const result = await PackageService.getAllPackagesService({
          searchCondition,
          pageInfo,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in getAllPackagesController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
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
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in getPackageByIdController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi lấy thông tin gói",
        });
      }
    }),

  updatePackageController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { id: package_id } = req.params;
        const { package_name, description, price, img_url, user_id, is_premium, ai_model, supported_features } = req.body;

        const result = await PackageService.updatePackageService({
          package_id,
          package_name,
          description,
          price,
          img_url,
          user_id,
          is_premium,
          ai_model,
          supported_features,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in updatePackageController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi cập nhật gói",
        });
      }
    }),

  softDeletePackageController: (req, res) =>
    new Promise(async (resolve, reject) => {
      try {
        const { id: package_id } = req.params;
        const { user_id } = req.body;

        const result = await PackageService.softDeletePackageService({
          package_id,
          user_id,
        });

        return res.status(result.status).json({
          status: result.status,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        console.error('Error in softDeletePackageController:', error.message);
        return res.status(500).json({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi xóa mềm gói",
        });
      }
    }),
};