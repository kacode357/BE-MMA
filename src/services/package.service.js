const PackageModel = require("../models/package.model");
const UserModel = require("../models/user.model");
const PurchaseModel = require("../models/purchase.model");
const GroupMemberModel = require("../models/groupMember.model");

module.exports = {
  createPackageService: (packageData) =>
    new Promise(async (resolve, reject) => {
      try {
        const { package_name, description, price, img_url, user_id, is_premium, ai_model, supported_features } = packageData;

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể tạo gói",
          });
        }

        if (!package_name || price == null) {
          return reject({
            status: 400,
            ok: false,
            message: "Tên gói và giá là bắt buộc",
          });
        }

        if (price < 0) {
          return reject({
            status: 400,
            ok: false,
            message: "Giá phải lớn hơn hoặc bằng 0",
          });
        }

        // Validate ai_model if provided
        if (ai_model && !["gemini", "thehive", "none"].includes(ai_model)) {
          return reject({
            status: 400,
            ok: false,
            message: "ai_model phải là 'gemini', 'thehive', hoặc 'none'",
          });
        }

        // Validate supported_features if provided
        if (supported_features) {
          if (!Array.isArray(supported_features) || supported_features.length === 0) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải là mảng không rỗng",
            });
          }
          const validFeatures = ["text", "image", "image_to_image"];
          if (!supported_features.every(feature => validFeatures.includes(feature))) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải chứa các giá trị: 'text', 'image', hoặc 'image_to_image'",
            });
          }
        }

        const newPackage = await PackageModel.create({
          package_name,
          description,
          price,
          img_url,
          is_premium: is_premium || false,
          ai_model: ai_model || "none",
          supported_features: supported_features || ["text"],
        });

        resolve({
          status: 201,
          ok: true,
          message: "Tạo gói thành công",
          data: {
            package_id: newPackage._id,
            package_name: newPackage.package_name,
            description: newPackage.description,
            price: newPackage.price,
            img_url: newPackage.img_url,
            created_at: newPackage.created_at,
            is_delete: newPackage.is_delete,
            is_premium: newPackage.is_premium,
            ai_model: newPackage.ai_model,
            supported_features: newPackage.supported_features,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi tạo gói: " + error.message,
        });
      }
    }),

  checkPackageAccessService: ({ user_id, package_id, requested_feature }) =>
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

        // Check if requested_feature is supported
        if (requested_feature && !packageData.supported_features.includes(requested_feature)) {
          return reject({
            status: 403,
            ok: false,
            message: `Gói này không hỗ trợ tính năng '${requested_feature}'`,
          });
        }

        // Check if ai_model matches requested feature's requirements
        if (requested_feature === "image_to_image" && packageData.ai_model !== "gemini") {
          return reject({
            status: 403,
            ok: false,
            message: "Tính năng image_to_image chỉ hỗ trợ với ai_model là 'gemini'",
          });
        }

        // User có role = premium: Truy cập tất cả gói AI
        if (user.role === "premium") {
          return resolve({
            status: 200,
            ok: true,
            message: "Có quyền sử dụng gói với role Premium",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium,
                ai_model: packageData.ai_model,
                supported_features: packageData.supported_features,
              },
            },
          });
        }

        // Kiểm tra gói miễn phí
        if (packageData.price === 0) {
          return resolve({
            status: 200,
            ok: true,
            message: "Có quyền sử dụng gói miễn phí",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium,
                ai_model: packageData.ai_model,
                supported_features: packageData.supported_features,
              },
            },
          });
        }

        // Kiểm tra gói trả phí
        const purchase = await PurchaseModel.findOne({
          user_id,
          package_id,
          status: "completed",
        });
        if (purchase) {
          return resolve({
            status: 200,
            ok: true,
            message: "Có quyền sử dụng gói đã mua",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium,
                ai_model: packageData.ai_model,
                supported_features: packageData.supported_features,
              },
            },
          });
        }

        // Kiểm tra quyền qua nhóm
        const groupMember = await GroupMemberModel.findOne({
          user_id,
          group_id: { $in: (await PurchaseModel.find({ package_id, status: "completed" })).map(p => p.group_id) },
        });
        if (groupMember) {
          return resolve({
            status: 200,
            ok: true,
            message: "Có quyền sử dụng gói qua nhóm",
            data: {
              has_access: true,
              package: {
                package_id: packageData._id,
                package_name: packageData.package_name,
                description: packageData.description,
                price: packageData.price,
                img_url: packageData.img_url,
                created_at: packageData.created_at,
                is_premium: packageData.is_premium,
                ai_model: packageData.ai_model,
                supported_features: packageData.supported_features,
              },
            },
          });
        }

        return reject({
          status: 403,
          ok: false,
          message: "Không có quyền sử dụng gói",
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi kiểm tra quyền sử dụng gói: " + error.message,
        });
      }
    }),

  getAllPackagesService: ({ searchCondition, pageInfo }) =>
    new Promise(async (resolve, reject) => {
      try {
        const { keyword = '', is_delete = false, is_premium, ai_model, supported_features } = searchCondition || {};
        const { pageNum = 1, pageSize = 10 } = pageInfo || {};

        // Validate pageNum và pageSize
        if (!Number.isInteger(pageNum) || pageNum < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageNum phải là số nguyên dương",
          });
        }

        if (!Number.isInteger(pageSize) || pageSize < 1) {
          return reject({
            status: 400,
            ok: false,
            message: "pageSize phải là số nguyên dương",
          });
        }

        // Validate is_premium
        if (is_premium !== undefined && typeof is_premium !== 'boolean') {
          return reject({
            status: 400,
            ok: false,
            message: "is_premium phải là giá trị boolean",
          });
        }

        // Validate ai_model
        if (ai_model && !["gemini", "thehive", "none"].includes(ai_model)) {
          return reject({
            status: 400,
            ok: false,
            message: "ai_model phải là 'gemini', 'thehive', hoặc 'none'",
          });
        }

        // Validate supported_features
        if (supported_features) {
          if (!Array.isArray(supported_features) || supported_features.length === 0) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải là mảng không rỗng",
            });
          }
          const validFeatures = ["text", "image", "image_to_image"];
          if (!supported_features.every(feature => validFeatures.includes(feature))) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải chứa các giá trị: 'text', 'image', hoặc 'image_to_image'",
            });
          }
        }

        // Tạo điều kiện tìm kiếm
        const searchQuery = {
          $and: [
            {
              $or: [
                { package_name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
              ],
            },
            { is_delete: is_delete },
          ],
        };

        if (is_premium !== undefined) {
          searchQuery.$and.push({ is_premium });
        }

        if (ai_model) {
          searchQuery.$and.push({ ai_model });
        }

        if (supported_features) {
          searchQuery.$and.push({ supported_features: { $all: supported_features } });
        }

        // Tính toán phân trang
        const skip = (pageNum - 1) * pageSize;
        const limit = pageSize;

        // Lấy danh sách gói
        const packages = await PackageModel.find(searchQuery)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });

        // Lấy tổng số gói phù hợp
        const total = await PackageModel.countDocuments(searchQuery);

        // Tính tổng số trang
        const totalPages = Math.ceil(total / pageSize);

        // Format dữ liệu trả về
        const packageList = packages.map(pkg => ({
          package_id: pkg._id,
          package_name: pkg.package_name,
          description: pkg.description,
          price: pkg.price,
          img_url: pkg.img_url,
          created_at: pkg.created_at,
          is_delete: pkg.is_delete,
          is_premium: pkg.is_premium,
          ai_model: pkg.ai_model,
          supported_features: pkg.supported_features,
        }));

        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh sách gói thành công",
          data: {
            pageData: packageList,
            pageInfo: {
              pageNum,
              pageSize,
              total,
              totalPages,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy danh sách gói: " + error.message,
        });
      }
    }),

  getPackageByIdService: ({ package_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
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

        resolve({
          status: 200,
          ok: true,
          message: "Lấy thông tin gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium,
            ai_model: packageData.ai_model,
            supported_features: packageData.supported_features,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi lấy thông tin gói: " + error.message,
        });
      }
    }),

  updatePackageService: ({ package_id, package_name, description, price, img_url, user_id, is_premium, ai_model, supported_features }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
          });
        }

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể cập nhật gói",
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

        if (packageData.is_delete) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói đã bị xóa, không thể cập nhật",
          });
        }

        if (package_name) {
          const existingPackage = await PackageModel.findOne({
            package_name,
            is_delete: false,
            _id: { $ne: package_id },
          });
          if (existingPackage) {
            return reject({
              status: 409,
              ok: false,
              message: "Tên gói đã tồn tại",
            });
          }
          packageData.package_name = package_name;
        }

        if (description !== undefined) packageData.description = description;

        if (price !== undefined) {
          if (price < 0) {
            return reject({
              status: 400,
              ok: false,
              message: "Giá phải lớn hơn hoặc bằng 0",
            });
          }
          packageData.price = price;
        }

        if (img_url !== undefined) packageData.img_url = img_url;

        if (is_premium !== undefined) packageData.is_premium = is_premium;

        // Validate and update ai_model
        if (ai_model !== undefined) {
          if (!["gemini", "thehive", "none"].includes(ai_model)) {
            return reject({
              status: 400,
              ok: false,
              message: "ai_model phải là 'gemini', 'thehive', hoặc 'none'",
            });
          }
          packageData.ai_model = ai_model;
        }

        // Validate and update supported_features
        if (supported_features !== undefined) {
          if (!Array.isArray(supported_features) || supported_features.length === 0) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải là mảng không rỗng",
            });
          }
          const validFeatures = ["text", "image", "image_to_image"];
          if (!supported_features.every(feature => validFeatures.includes(feature))) {
            return reject({
              status: 400,
              ok: false,
              message: "supported_features phải chứa các giá trị: 'text', 'image', hoặc 'image_to_image'",
            });
          }
          packageData.supported_features = supported_features;
        }

        await packageData.save();

        resolve({
          status: 200,
          ok: true,
          message: "Cập nhật gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium,
            ai_model: packageData.ai_model,
            supported_features: packageData.supported_features,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi cập nhật gói: " + error.message,
        });
      }
    }),

  softDeletePackageService: ({ package_id, user_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        if (!package_id) {
          return reject({
            status: 400,
            ok: false,
            message: "package_id là bắt buộc",
          });
        }

        if (!user_id) {
          return reject({
            status: 400,
            ok: false,
            message: "user_id là bắt buộc",
          });
        }

        const user = await UserModel.findById(user_id);
        if (!user || user.role !== "admin") {
          return reject({
            status: 403,
            ok: false,
            message: "Chỉ admin mới có thể xóa gói",
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

        if (packageData.is_delete) {
          return reject({
            status: 400,
            ok: false,
            message: "Gói đã bị xóa trước đó",
          });
        }

        packageData.is_delete = true;
        await packageData.save();

        resolve({
          status: 200,
          ok: true,
          message: "Xóa gói thành công",
          data: {
            package_id: packageData._id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            img_url: packageData.img_url,
            created_at: packageData.created_at,
            is_delete: packageData.is_delete,
            is_premium: packageData.is_premium,
            ai_model: packageData.ai_model,
            supported_features: packageData.supported_features,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: "Lỗi khi xóa mềm gói: " + error.message,
        });
      }
    }),
};