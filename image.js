const fs = require("fs");
const handlebars = require("handlebars");
const puppeteer = require("puppeteer");
const { nodeHtmlToImage } = require("./htmlToImage");

const imageURL =
  "https://api.doggy.market/inscriptions/23bc218908381792631af76aa8dc071f11463b14161a8abfe01ca1c27dc90721i0/content";
const filePath = "./index.html";
const createImage = ({
  id,
  imageURL,
  collectionName,
  price,
  priceUSD,
  pricePerToken,
  pricePerTokenUSD,
  buyer,
  supply,
  mc,
  holder,
  collectionId,
  itemId,
}) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject("Error reading the file: " + err.message);
        return;
      }
      const output = `./assets/nft-proof-${id}.png`;
      const template = handlebars.compile(data);
      nodeHtmlToImage({
        output,
        puppeteer,
        puppeteerArgs: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-site-isolation-trials",
            "--disable-features=BlockInsecurePrivateNetworkRequests",
            "--disable-features=SameSiteByDefaultCookies",
            "--disable-features=CookiesWithoutSameSiteMustBeSecure",
          ],
          headless: "new",
        },
        html: template({
          imageURL,
          collectionName,
          collectionId: `${collectionId}#${itemId}`,
          price,
          priceUSD,
          pricePerToken,
          pricePerTokenUSD,
          buyer,
          supply,
          mc,
          holder,
        }),
      }).then(() => {
        resolve(output);
      });
    });
  });
};

const deleteImage = ({ id }) => {
  const imagePath = `./assets/nft-proof-${id}.png`;
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    console.log(`Image '${imagePath}' deleted successfully.`);
  } else {
    console.log(`Image '${imagePath}' not found in the specified directory.`);
  }
};

createImage({
  collectionName: "Testaaa",
  id: 123,
  imageURL:
    "https://api.doggy.market/inscriptions/ed28ccb178623c571c4c367eb0557fed09a6da0a0e522c6e7c43355506b615bfi0/content",
});

module.exports = {
  createImage,
  deleteImage,
};
