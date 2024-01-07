const { toNumber } = require("lodash");
const { formatUSD2, formatVND } = require("./market");

const formatBalance = (data) => {
  return formatUSD2(toNumber(data) / 100000000);
};
const formatBalance1 = (data) => {
  return formatVND(toNumber(data) / 100000000);
};

module.exports = { formatBalance, formatBalance1 };
