const puppeteer = require("puppeteer");

async function htmlToImage(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    );
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const element = await page.$("body");
    await element.screenshot({
      path: outputPath,
      type: "png",
      omitBackground: false,
      //   encoding: "base64",
      //   quality: 80,
    });

    console.log(`Image saved to ${outputPath}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

const nodeHtmlToImage = async ({ output, html }) => {
  return htmlToImage(html, output);
};

module.exports = {
  nodeHtmlToImage,
};
