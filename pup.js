const { request } = require("./request");
const { callAPI } = require("./pupupter");

const makeCallAPI = async (url) => {
  return request(url);
};

module.exports = { makeCallAPI };
