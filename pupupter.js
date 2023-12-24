const puppeteer = require("puppeteer");

const callAPI = async (website, url) => {
  if (!website || !url) {
    return { error: "Please check website or url" };
  }
  const browser = await puppeteer.launch({
    headless: "new", // if you want to see what the browser is doing, you need to change this option to "false"
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    );
    // Navigate to a website
    await page.goto(website);
    // Execute JavaScript code on the page
    const result = await page.evaluate(
      async (url1, website1) => {
        const res = await fetch(url1, {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
          },
          referrer: website1,
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "include",
        });
        const data = await res.json();
        return data;
      },
      url,
      website
    );
    console.log("aaa", result);
    return result;
  } catch (error) {
    return { error: error.toString() };
  } finally {
    await browser.close();
  }
};

module.exports = {
  callAPI,
};
