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

        // Check if user exists
        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        // Check if package exists and is not free
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

        // Check for existing purchase
        const existingPurchase = await PurchaseModel.findOne({
          user_id,
          package_id,
          status: { $in: ['pending', 'completed'] },
        })
          .populate('package_id', 'package_name price')
          .populate('user_id', 'username')
          .lean();

        if (existingPurchase) {
          return resolve({
            status: 200,
            ok: true,
            message: "Giao dịch mua đã tồn tại, không cần tạo mới",
            data: {
              purchase_id: existingPurchase._id,
              created_at: existingPurchase.purchase_date,
              package_name: existingPurchase.package_id.package_name,
              price: existingPurchase.package_id.price,
              user_id: existingPurchase.user_id._id,
              username: existingPurchase.user_id.username,
              status: existingPurchase.status,
            },
          });
        }

        // Create new purchase with group_id = null
        const purchase = await PurchaseModel.create({
          user_id,
          package_id,
          group_id: null,
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
            price: package.price,
            user_id: purchase.user_id,
            username: user.username,
            status: purchase.status,
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

  searchPurchasesService: (req, searchCondition = {}, pageInfo = {}) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword = '', status = '' } = searchCondition;
        const { pageNum = 1, pageSize = 10 } = pageInfo;

        const userRole = req.user.role;
        console.log('User role in searchPurchasesService:', userRole);

        if (!['admin', 'user'].includes(userRole)) {
          return reject({
            status: 403,
            ok: false,
            message: "Quyền không hợp lệ. Chỉ admin hoặc user mới được phép tìm kiếm.",
          });
        }

        const query = {};
        if (userRole === 'user') {
          query.user_id = req.user._id;
        }

        if (keyword) {
          const packageQuery = { package_name: { $regex: keyword, $options: 'i' } };
          const packages = await PackageModel.find(packageQuery).select('_id');
          const packageIds = packages.map(pkg => pkg._id);
          query.package_id = { $in: packageIds };
        }

        if (status) {
          query.status = { $in: [status] };
        }

        const skip = (pageNum - 1) * pageSize;
        const totalItems = await PurchaseModel.countDocuments(query);
        const purchases = await PurchaseModel.find(query)
          .populate('package_id', 'package_name price')
          .populate('user_id', 'username')
          .skip(skip)
          .limit(pageSize)
          .lean();

        const totalPages = Math.ceil(totalItems / pageSize);

        const pageData = purchases.map(purchase => ({
          purchase_id: purchase._id,
          user_id: purchase.user_id._id,
          username: purchase.user_id.username,
          package_id: purchase.package_id._id,
          package_name: purchase.package_id.package_name,
          price: purchase.package_id.price,
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

  checkPurchaseService: (user_id, package_id) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!user_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và package_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        const existingPurchase = await PurchaseModel.findOne({
          user_id,
          package_id,
          status: { $in: ['pending', 'completed'] },
        })
          .populate('package_id', 'package_name price')
          .populate('user_id', 'username')
          .lean();

        if (existingPurchase) {
          return resolve({
            status: 200,
            ok: true,
            message: "Giao dịch mua đã tồn tại",
            data: {
              purchase_id: existingPurchase._id,
              created_at: existingPurchase.purchase_date,
              package_name: existingPurchase.package_id.package_name,
              price: existingPurchase.package_id.price,
              user_id: existingPurchase.user_id._id,
              username: existingPurchase.user_id.username,
              status: existingPurchase.status,
            },
          });
        }

        resolve({
          status: 200,
          ok: true,
          message: "Chưa có giao dịch mua, có thể tạo mới",
          data: null,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi kiểm tra giao dịch mua: " + error.message,
        });
      }
    }),

  upgradePremiumService: (user_id, package_id) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!user_id || !package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và package_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        const packageData = await PackageModel.findById(package_id);
        console.log('Package:', packageData);
        if (!packageData) {
          return reject({
            status: 404,
            ok: false,
            message: "Gói không tồn tại",
          });
        }

        if (!packageData.is_premium) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói này không phải là gói Premium",
          });
        }

        const existingPurchase = await PurchaseModel.findOne({
          user_id,
          package_id,
          status: { $in: ['pending', 'completed'] },
        })
          .populate('package_id', 'package_name price')
          .populate('user_id', 'username')
          .lean();

        if (existingPurchase) {
          return resolve({
            status: 200,
            ok: true,
            message: "Giao dịch mua đã tồn tại, vui lòng hoàn tất thanh toán để nâng cấp role Premium",
            data: {
              purchase_id: existingPurchase._id,
              created_at: existingPurchase.purchase_date,
              package_name: existingPurchase.package_id.package_name,
              price: existingPurchase.package_id.price,
              user_id: existingPurchase.user_id._id,
              username: existingPurchase.user_id.username,
              status: existingPurchase.status,
            },
          });
        }

        const purchase = await PurchaseModel.create({
          user_id,
          package_id,
          group_id: null,
          status: "pending",
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo giao dịch mua thành công, vui lòng hoàn tất thanh toán để nâng cấp role Premium",
          data: {
            purchase_id: purchase._id,
            created_at: purchase.purchase_date,
            package_name: packageData.package_name,
            price: packageData.price,
            user_id: purchase.user_id,
            username: user.username,
            status: purchase.status,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo giao dịch nâng cấp Premium: " + error.message,
        });
      }
    }),

  completePurchaseService: (user_id, purchase_id) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!user_id || !purchase_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id và purchase_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
          return reject({
            status: 404,
            ok: false,
            message: "Người dùng không tồn tại",
          });
        }

        const purchase = await PurchaseModel.findById(purchase_id)
          .populate('package_id', 'package_name price is_premium')
          .populate('user_id', 'username')
          .lean();
        if (!purchase) {
          return reject({
            status: 404,
            ok: false,
            message: "Giao dịch không tồn tại",
          });
        }

        if (purchase.user_id._id.toString() !== user_id) {
          return reject({
            status: 403,
            ok: false,
            message: "Bạn không có quyền hoàn tất giao dịch này",
          });
        }

        if (purchase.status === 'completed') {
          return resolve({
            status: 200,
            ok: true,
            message: "Giao dịch đã được hoàn tất trước đó",
            data: {
              purchase_id: purchase._id,
              created_at: purchase.purchase_date,
              package_name: purchase.package_id.package_name,
              price: purchase.package_id.price,
              user_id: purchase.user_id._id,
              username: purchase.user_id.username,
              status: purchase.status,
            },
          });
        }

        // Cập nhật trạng thái giao dịch thành completed
        await PurchaseModel.findByIdAndUpdate(purchase_id, { status: 'completed' }, { new: true });

        // Nếu gói là Premium, nâng cấp role của người dùng
        if (purchase.package_id.is_premium) {
          if (user.role !== 'premium') {
            await UserModel.findByIdAndUpdate(user_id, { role: 'premium' }, { new: true });
            console.log(`User ${user_id} role updated to premium`);
          }
        }

        resolve({
          status: 200,
          ok: true,
          message: "Hoàn tất giao dịch thành công" + (purchase.package_id.is_premium ? " và đã nâng cấp role Premium" : ""),
          data: {
            purchase_id: purchase._id,
            created_at: purchase.purchase_date,
            package_name: purchase.package_id.package_name,
            price: purchase.package_id.price,
            user_id: purchase.user_id._id,
            username: purchase.user_id.username,
            status: 'completed',
            updated_role: purchase.package_id.is_premium ? 'premium' : undefined,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi hoàn tất giao dịch: " + error.message,
        });
      }
    }),
};