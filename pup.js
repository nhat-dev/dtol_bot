const { request } = require("./request");
const { callAPI } = require("./pupupter");

const makeCallAPI = async (url) => {
  try {
    const daya = await request(url);
  } catch (error) {
    return null;
  }
};

module.exports = { makeCallAPI };
