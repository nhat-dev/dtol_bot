const { exec } = require("child_process");
const randomUseragent = require("random-useragent");
const JSON5 = require("json5");

const request = (url) => {
  const useragent = randomUseragent.getRandom();
  console.log("useragent", useragent);
  const curlCommand = `curl '${url}' \
    -H 'authority: api.doggy.market' \
    -H 'accept: */*' \
    -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
    -H 'origin: https://doggy.market' \
    -H 'referer: https://doggy.market/' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-site' \
    -H 'user-agent: ${useragent}'`;

  console.log("start request", url);
  return new Promise((resolve, reject) => {
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log("stderr", stdout);
      try {
        const res = JSON5.parse(stdout);
        resolve(res);
      } catch (error1) {
        reject(error1);
      }
    });
  });
};

module.exports = {
  request,
};
