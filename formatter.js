const { toNumber } = require("lodash");
const { formatUSD2 } = require("./market");

const formatBalance = (data) => {
  return formatUSD2(toNumber(data) / 100000000);
};

module.exports = { formatBalance };
