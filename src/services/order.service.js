const OrderModel = require("../models/order.model");
const FoodModel = require("../models/food.model");
const UserModel = require("../models/user.model"); // Import UserModel để kiểm tra UserId

module.exports = {
  createOrderService: (orderData) =>
    new Promise(async (resolve, reject) => {
      try {
        let total_price = 0;

        // Kiểm tra UserId có tồn tại không
        const userExists = await UserModel.findById(orderData.created_by);
        if (!userExists) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy người dùng với ID: ${orderData.created_by}`,
          });
        }

        // Kiểm tra từng món và lấy giá từ DB
        for (const item of orderData.items) {
          const food = await FoodModel.findById(item.food_id);
          if (!food) {
            return reject({
              status: 404,
              ok: false,
              message: `Không tìm thấy món ăn với ID: ${item.food_id}`,
            });
          }

          // Cập nhật giá và tính tổng giá
          item.price = food.price;
          total_price += food.price * item.quantity;
        }

        // Kiểm tra đơn hàng đã tồn tại
        const existingOrder = await OrderModel.findOne({
          created_by: orderData.created_by,
          status: "pending", // Điều kiện kiểm tra đơn hàng
        });

        if (existingOrder) {
          // Cập nhật số lượng món ăn nếu đã tồn tại
          for (const newItem of orderData.items) {
            const existingItem = existingOrder.items.find(
              (item) => item.food_id.toString() === newItem.food_id.toString()
            );

            if (existingItem) {
              existingItem.quantity += newItem.quantity;
            } else {
              existingOrder.items.push(newItem);
            }
          }

          // Cập nhật tổng giá
          existingOrder.total_price += total_price;
          await existingOrder.save();

          return resolve({
            status: 200,
            ok: true,
            message: "Cập nhật đơn hàng thành công",
            order: existingOrder,
          });
        }

        // Nếu đơn hàng chưa tồn tại, tạo mới
        orderData.total_price = total_price;
        const newOrder = await OrderModel.create(orderData);
        resolve({
          status: 201,
          ok: true,
          message: "Tạo đơn hàng thành công",
          order: newOrder,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Xử lý đơn hàng thất bại",
        });
      }
    }),
    getOrdersService: ({ status }) =>
      new Promise(async (resolve, reject) => {
        try {
          const query = status ? { status } : {}; // Lọc trạng thái nếu được cung cấp
          const orders = await OrderModel.find(query)
            .populate("items.food_id", "name price") // Lấy thông tin món ăn
            .populate("created_by", "_id username"); // Lấy ID và username của người tạo
    
          // Tính tổng số lượng sản phẩm cho từng đơn hàng
          const ordersWithTotalItems = orders.map((order) => {
            const total_items = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            return {
              ...order.toObject(), // Chuyển document MongoDB sang object để chỉnh sửa
              total_items,
            };
          });
    
          resolve({
            status: 200,
            ok: true,
            message: "Lấy danh sách đơn hàng thành công",
            data: {
              orders: ordersWithTotalItems, // Đặt orders vào bên trong data
            },
          });
        } catch (error) {
          reject({
            status: 500,
            ok: false,
            message: error.message || "Lỗi khi lấy danh sách đơn hàng",
          });
        }
      }),
    

  // Lấy chi tiết một đơn hàng theo ID
  getOrderByIdService: ({ orderId }) =>
    new Promise(async (resolve, reject) => {
      try {
        const order = await OrderModel.findById(orderId)
          .populate("items.food_id", "name price") // Lấy thông tin món ăn
          .populate("created_by", "_id username"); // Lấy ID và username của người tạo

        if (!order) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy đơn hàng với ID: ${orderId}`,
          });
        }

        // Tính tổng số lượng sản phẩm
        const total_items = order.items.reduce((sum, item) => sum + item.quantity, 0);

        resolve({
          status: 200,
          ok: true,
          message: "Lấy thông tin đơn hàng thành công",
          order: {
            ...order.toObject(), // Chuyển document MongoDB sang object
            total_items,
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi khi lấy thông tin đơn hàng",
        });
      }
    }),
  updateFoodQuantityService: ({ food_id, quantity }) =>
    new Promise(async (resolve, reject) => {
      try {
        // Tìm đơn hàng trạng thái "pending"
        const order = await OrderModel.findOne({ status: "pending" });

        if (!order) {
          return reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy đơn hàng trạng thái 'pending'",
          });
        }

        // Tìm món ăn trong danh sách items
        const foodItem = order.items.find((item) => item.food_id.toString() === food_id);

        if (!foodItem) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy món ăn với ID: ${food_id} trong đơn hàng`,
          });
        }

        if (quantity === 0) {
          // Nếu số lượng = 0, xóa món ăn khỏi đơn hàng
          order.items = order.items.filter((item) => item.food_id.toString() !== food_id);
        } else {
          // Cập nhật số lượng món ăn
          foodItem.quantity = quantity;
        }

        // Tính lại tổng giá trị đơn hàng
        order.total_price = order.items.reduce((total, item) => total + item.price * item.quantity, 0);

        // Lưu đơn hàng
        await order.save();

        resolve({
          status: 200,
          ok: true,
          message: `Cập nhật số lượng món ăn thành công`,
          order,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi cập nhật số lượng món ăn",
        });
      }
    }),
      // Tăng số lượng sản phẩm (Tạo mới đơn hàng nếu chưa có)
  // Tăng số lượng sản phẩm
  increaseOrderItemQuantityService: ({ userId, food_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        // Tìm đơn hàng trạng thái "pending"
        let order = await OrderModel.findOne({ status: "pending", created_by: userId });

        if (!order) {
          // Tạo mới đơn hàng nếu chưa có
          order = await OrderModel.create({
            created_by: userId,
            items: [],
            total_price: 0,
            status: "pending",
          });
        }

        // Tìm món ăn trong danh sách items
        let foodItem = order.items.find((item) => item.food_id.toString() === food_id);

        if (!foodItem) {
          // Nếu món ăn chưa tồn tại trong đơn hàng, thêm mới
          const food = await FoodModel.findById(food_id);
          if (!food) {
            return reject({
              status: 404,
              ok: false,
              message: `Không tìm thấy món ăn với ID: ${food_id}`,
            });
          }

          foodItem = {
            food_id: food_id,
            quantity: 1,
            price: food.price,
          };

          order.items.push(foodItem);
        } else {
          // Nếu món ăn đã tồn tại, tăng số lượng
          foodItem.quantity += 1;
        }

        // Tính lại tổng giá trị và số lượng món ăn
        order.total_price = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
        const total_items = order.items.reduce((sum, item) => sum + item.quantity, 0);

        // Lưu đơn hàng
        await order.save();

        resolve({
          status: 200,
          ok: true,
          message: `Tăng số lượng món ăn thành công`,
          data: {
            order: {
              ...order.toObject(),
              total_items,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi tăng số lượng món ăn",
        });
      }
    }),

  // Giảm số lượng sản phẩm
  decreaseOrderItemQuantityService: ({ userId, food_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        // Tìm đơn hàng trạng thái "pending"
        const order = await OrderModel.findOne({ status: "pending", created_by: userId });

        if (!order) {
          return reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy đơn hàng trạng thái 'pending'",
          });
        }

        // Tìm món ăn trong danh sách items
        const foodItem = order.items.find((item) => item.food_id.toString() === food_id);

        if (!foodItem) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy món ăn với ID: ${food_id} trong đơn hàng`,
          });
        }

        // Giảm số lượng món ăn
        foodItem.quantity -= 1;

        if (foodItem.quantity <= 0) {
          // Nếu số lượng <= 0, xóa món ăn khỏi đơn hàng
          order.items = order.items.filter((item) => item.food_id.toString() !== food_id);
        }

        // Tính lại tổng giá trị và số lượng món ăn
        order.total_price = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
        const total_items = order.items.reduce((sum, item) => sum + item.quantity, 0);

        if (order.items.length === 0) {
          // Nếu không còn món nào trong đơn hàng, xóa đơn hàng
          await OrderModel.deleteOne({ _id: order._id });
          return resolve({
            status: 200,
            ok: true,
            message: `Đơn hàng đã được xóa vì không còn món ăn nào`,
          });
        }

        // Lưu đơn hàng
        await order.save();

        resolve({
          status: 200,
          ok: true,
          message: `Giảm số lượng món ăn thành công`,
          data: {
            order: {
              ...order.toObject(),
              total_items,
            },
          },
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi giảm số lượng món ăn",
        });
      }
    }),
};
