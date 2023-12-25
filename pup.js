const { request } = require("./request");
const { callAPI } = require("./pupupter");

const makeCallAPI = async (url) => {
  return callAPI("https://doggy.market/", url);
};

module.exports = { makeCallAPI };
