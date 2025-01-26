const OrderModel = require("../models/order.model");
const FoodModel = require("../models/food.model");

module.exports = {
  createOrderService: (orderData) =>
    new Promise(async (resolve, reject) => {
      try {
        let total_price = 0;

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
          status: "pending",
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
        const query = { status: "pending" };
        const orders = await OrderModel.find(query)
          .populate("items.food_id", "name price");

        // Tính tổng số lượng sản phẩm cho từng đơn hàng
        const ordersWithTotalItems = orders.map((order) => {
          const total_items = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          return {
            ...order.toObject(),
            total_items,
          };
        });

        const result =
          ordersWithTotalItems.length === 1
            ? ordersWithTotalItems[0]
            : ordersWithTotalItems;

        resolve({
          status: 200,
          ok: true,
          message: "Lấy danh sách đơn hàng thành công",
          data: result,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi khi lấy danh sách đơn hàng",
        });
      }
    }),

  getOrderByIdService: ({ orderId }) =>
    new Promise(async (resolve, reject) => {
      try {
        const order = await OrderModel.findById(orderId)
          .populate("items.food_id", "name price");

        if (!order) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy đơn hàng với ID: ${orderId}`,
          });
        }

        const total_items = order.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        resolve({
          status: 200,
          ok: true,
          message: "Lấy thông tin đơn hàng thành công",
          order: {
            ...order.toObject(),
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
        const order = await OrderModel.findOne({ status: "pending" });

        if (!order) {
          return reject({
            status: 404,
            ok: false,
            message: "Không tìm thấy đơn hàng trạng thái 'pending'",
          });
        }

        const foodItem = order.items.find(
          (item) => item.food_id.toString() === food_id
        );

        if (!foodItem) {
          return reject({
            status: 404,
            ok: false,
            message: `Không tìm thấy món ăn với ID: ${food_id} trong đơn hàng`,
          });
        }

        if (quantity === 0) {
          order.items = order.items.filter(
            (item) => item.food_id.toString() !== food_id
          );
        } else {
          foodItem.quantity = quantity;
        }

        order.total_price = order.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );

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

  increaseOrderItemQuantityService: ({ food_id }) =>
    new Promise(async (resolve, reject) => {
      try {
        let order = await OrderModel.findOne({ status: "pending" });

        if (!order) {
          order = await OrderModel.create({
            items: [],
            total_price: 0,
            status: "pending",
          });
        }

        let foodItem = order.items.find(
          (item) => item.food_id.toString() === food_id
        );

        if (!foodItem) {
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
          foodItem.quantity += 1;
        }

        order.total_price = order.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );

        await order.save();

        resolve({
          status: 200,
          ok: true,
          message: `Tăng số lượng món ăn thành công`,
          data: order,
        });
      } catch (error) {
        reject({
          status: 500,
          ok: false,
          message: error.message || "Lỗi server khi tăng số lượng món ăn",
        });
      }
    }),
};
