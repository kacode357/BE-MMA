const crypto = require("crypto");
const config = require("config");

function validateIpnSignature(query) {
  const { vnp_SecureHash, ...restParams } = query;
  const sortedParams = Object.keys(restParams)
    .sort()
    .reduce((obj, key) => {
      obj[key] = restParams[key];
      return obj;
    }, {});

  const querystring = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const hash = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(querystring)
    .digest("hex");

  return hash === vnp_SecureHash;
}

module.exports = { validateIpnSignature };