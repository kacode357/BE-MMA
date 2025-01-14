const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const config = require('config');

const createPaymentUrl = async (body, headers) => {
    try {
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const ipAddr = headers['x-forwarded-for'] ||
                       headers.connection?.remoteAddress ||
                       headers.socket?.remoteAddress ||
                       headers.connection?.socket?.remoteAddress ||
                       '127.0.0.1'; // Default IP if not found

        const tmnCode = config.get('vnp_TmnCode');
        const secretKey = config.get('vnp_HashSecret');
        const vnpUrl = config.get('vnp_Url');
        const returnUrl = config.get('vnp_ReturnUrl');

        const orderId = moment(date).format('DDHHmmss');
        const amount = body.amount * 100; // Convert to smallest unit
        const bankCode =  '';
        const locale = body.language || 'vn';
        const currCode = 'VND';

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': tmnCode,
            'vnp_Locale': locale,
            'vnp_CurrCode': currCode,
            'vnp_TxnRef': orderId,
            'vnp_OrderInfo': `Thanh+toan+don+hang%3A+${orderId}`,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount,
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
        };

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Sort parameters in alphabetical order
        vnp_Params = sortObject(vnp_Params);

        // Log sorted parameters
        console.log('--- STEP 1: Sorted Parameters ---');
        console.log(JSON.stringify(vnp_Params, null, 2));

        // Create signData string with URL encoding
        let signData = querystring.stringify(vnp_Params, { encode: true });
        console.log('--- STEP 2: Sign Data (Encoded for Hashing) ---');
        console.log(signData);

        // Generate HMAC SHA512 hash
        let hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Log generated hash
        console.log('--- STEP 3: Generated Secure Hash (HMAC SHA512) ---');
        console.log(signed);

        // Add Secure Hash to parameters
        vnp_Params['vnp_SecureHash'] = signed;

        // Return the full payment URL
        const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: true })}`;
        console.log('--- STEP 4: Final Payment URL ---');
        console.log(paymentUrl);

        return paymentUrl;
    } catch (error) {
        console.error('Error creating VNPAY payment URL:', error);
        throw new Error('Failed to generate payment URL');
    }
};

const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
};

module.exports = {
    createPaymentUrl,
};
