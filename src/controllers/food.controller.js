const GroupService = require("../services/food.service");

module.exports = {
  createFoodController: async (req, res) => {
    try {
      const { name, category, price, description, image_url } = req.body;
    
      if (!name || !category || !price) {
        return res.status(400).json({ message: "Tên, danh mục và giá là bắt buộc" });
      }
  
      const result = await GroupService.createFoodService({
        name,
        category,
        price,
        description,
        image_url,
      });
  
      return res.status(201).json(result);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ ok: false, message: "Lỗi server" });
    }
  },
  getFoodsController: async (req, res) => {
    try {
      const { searchCondition = {}, pageInfo = {} } = req.body;
      const { keyword = "", is_delete = false } = searchCondition;
      const { pageNum = 1, pageSize = 10 } = pageInfo;
  
      const offset = (pageNum - 1) * pageSize;

      const { foods, total } = await GroupService.getFoodsService({
        keyword,
        is_delete,
        offset,
        limit: pageSize,
      });

      const totalPages = Math.ceil(total / pageSize);

      return res.status(200).json({
        success: true,
        data: {
          pageData: foods,
          pageInfo: {
            pageNum,
            pageSize,
            totalItems: total,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
  ,
};
