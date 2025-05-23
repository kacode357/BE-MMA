const PurchaseModel = require("../models/purchase.model");
const UserModel = require("../models/user.model");
const PackageModel = require("../models/package.model");

module.exports = {
  createPurchaseService: (purchaseData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { user_id, package_id } = purchaseData;

        // Validate required fields
        if (!user_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và package_id là bắt buộc",
          });
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Kiểm tra package tồn tại và không miễn phí
        const package = await PackageModel.findById(package_id);
        if (!package) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }
        if (package.price === 0) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói miễn phí không cần mua",
          });
        }

        // Tạo giao dịch mua với group_id = null
        const purchase = await PurchaseModel.create({
          user_id,
          package_id,
          group_id: null, // Sẽ cập nhật sau khi tạo nhóm
          status: "pending",
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo giao dịch mua thành công",
          data: {
            purchase_id: purchase._id,
            created_at: purchase.purchase_date,
            package_name: package.package_name,
            user_id: purchase.user_id,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo giao dịch mua: " + error.message,
        });
      }
    }),

  searchPurchasesService: (searchCondition, pageInfo) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword, status } = searchCondition || {};
        const { pageNum = 1, pageSize = 10 } = pageInfo || {};

        // Validate required fields
        if (!pageInfo || !searchCondition) {
          return reject({
            status: 400,
            ok: false,
            message: "searchCondition và pageInfo là bắt buộc",
          });
        }

        // Xây dựng điều kiện tìm kiếm
        const query = {};

        // Tìm kiếm theo keyword (tìm trong package_name thông qua populate)
        if (keyword) {
          const packageQuery = { package_name: { $regex: keyword, $options: 'i' } };
          const packages = await PackageModel.find(packageQuery).select('_id');
          const packageIds = packages.map(pkg => pkg._id);
          query.package_id = { $in: packageIds };
        }

        // Tìm kiếm theo status
        if (status) {
          query.status = { $in: [status] };
        }

        // Tìm kiếm và phân trang
        const skip = (pageNum - 1) * pageSize;
        const totalItems = await PurchaseModel.countDocuments(query);
        const purchases = await PurchaseModel.find(query)
          .populate('package_id', 'package_name')
          .populate('user_id', 'username')
          .skip(skip)
          .limit(pageSize)
          .lean();

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(totalItems / pageSize);

        // Định dạng response
        const pageData = purchases.map(purchase => ({
          purchase_id: purchase._id,
          user_id: purchase.user_id._id,
          username: purchase.user_id.username,
          package_id: purchase.package_id._id,
          package_name: purchase.package_id.package_name,
          group_id: purchase.group_id,
          status: purchase.status,
          purchase_date: purchase.purchase_date,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Tìm kiếm giao dịch mua thành công",
          data: {
            pageData,
            pageInfo: {
              pageNum,
              pageSize,
              totalItems,
              totalPages,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tìm kiếm giao dịch mua: " + error.message,
        });
      }
    }),
};