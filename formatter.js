const { toNumber } = require("lodash");
const { formatUSD2, formatVND } = require("./market");

const formatBalance = (data) => {
  return formatUSD2(toNumber(data) / 100000000);
};
const formatBalance1 = (data) => {
  return formatVND(toNumber(data) / 100000000);
};

const convertToAbbreviation = (data, isCoin = false) => {
  const number = isCoin ? toNumber(data || 0) / 100000000 : toNumber(data || 0);
  if (number < 1000) {
    return formatVND(number);
  } else if (number < 1000000) {
    return (number / 1000).toFixed(1) + "K";
  } else {
    return (number / 1000000).toFixed(1) + "M";
  }
};

module.exports = { formatBalance, convertToAbbreviation, formatBalance1 };
