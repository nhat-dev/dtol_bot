const fetch = require("node-fetch");
const { callAPI } = require("./pupupter");

const makeCallAPI = async (url) => {
  return callAPI("https://doggy.market/", url);
};

module.exports = { makeCallAPI };
