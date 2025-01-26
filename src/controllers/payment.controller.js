const paymentService = require("../services/payment.service");

const createPayment = async (req, res) => {
  try {
    const { order_id, amount, method } = req.body;

    if (!order_id || !amount || !method) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const payment = await paymentService.createPayment({
      order_id,
      amount,
      method,
    });

    const data = {
      message: "Payment created successfully.",
      payment,
    };

    return res.status(201).json(data);

   
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Payment ID is required." });
    }

    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    return res.status(200).json({ payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, method } = req.body;

    if (!id || !status || !method) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const validStatuses = ["paid", "unpaid", "refunded"];
    const validMethods = ["cash", "qr_code"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid payment status." });
    }

    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    const updatedPayment = await paymentService.updatePaymentStatus(id, status, method);

    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    return res.status(200).json({ 
      message: "Payment status and method updated successfully.", 
      payment: updatedPayment 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createPayment,
  getPayment,
  updatePaymentStatus,
};
