const axios = require("axios");
module.exports.fetchBNBETHpriceTicker = function (of) {
  return axios
    .get("https://api.binance.com/api/v3/ticker/price?symbol=" + of)
    .then(function (response) {
      return response.data.price;
    })
    .catch((error) => {
      console.log("sorry couldn't fetch  the tocker price");
    });
};
