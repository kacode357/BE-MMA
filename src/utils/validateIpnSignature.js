const crypto = require("crypto");

function validateIpnSignature(params, receivedSignature) {
  const secretKey = process.env.VNPAY_SECRET_KEY;
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join("&");
  const generatedSignature = crypto.createHmac("sha512", secretKey).update(sortedParams).digest("hex");

  return generatedSignature === receivedSignature;
}

module.exports = { validateIpnSignature };
