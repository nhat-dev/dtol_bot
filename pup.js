const { request } = require("./request");
const { callAPI } = require("./pupupter");

const makeCallAPI = async (url) => {
  try {
    const data = await request(url);
    return data;
  } catch (error) {
    return null;
  }
};

module.exports = { makeCallAPI };
