const vnpayService = require('../services/vnpay.service');

const createPayment = async (req, res) => {
    try {
        const paymentUrl = await vnpayService.createPaymentUrl(req.body, req.headers);
        res.status(200).json({
            message: 'Payment URL generated successfully',
            paymentUrl: paymentUrl
        });
    } catch (error) {
        console.error("Error generating payment URL:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports = {
    createPayment,
};
