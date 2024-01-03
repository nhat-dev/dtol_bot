const {
  map,
  toNumber,
  get,
  groupBy,
  keys,
  toArray,
  filter,
  mapValues,
  sumBy,
} = require("lodash");
const fetch = require("node-fetch");
const { makeCallAPI } = require("./pup");
const { formatBalance } = require("./formatter");
const { formatVND } = require("./market");

const getListCoin = async (wallet) => {
  const data = await makeCallAPI(
    `https://api.doggy.market/wallet/${wallet}/holdings`
  );
  console.log("aaaa", data, wallet);
  const datas = await Promise.all(
    map(data, async (item) => {
      // const tick = await getPrice(item.tick);

      return {
        ...item,
        price: 0,
        //   toNumber(tick.marketcap) / toNumber(tick.max) / 0.09603 / 1000000000,
      };
    })
  );
  console.log("datas", datas);
  return datas;
};
const getPrice = async (tick) => {
  const data = await makeCallAPI(
    `https://api.doggy.market/listings/tick/${tick}?sortBy=pricePerToken&sortOrder=asc&offset=0&limit=10`
  );
  const price = toNumber(get(data, "data.0.pricePerToken", 0) / 100000000);
  return { price };
};

const getInfoCoin = async (tick) => {
  const [data, topholder] = await Promise.all([
    makeCallAPI(`https://api.doggy.market/token/${tick}`),
    makeCallAPI(
      `https://api.doggy.market/token/${tick}/holders?offset=0&limit=3`
    ),
  ]);

  return {
    price:
      toNumber(data.marketcap || 0) / toNumber(data.max) / 0.09603 / 1000000000,
    mc: toNumber(data.marketcap || 0) / 1000000000,
    supply: toNumber(data.max),
    tick: data.tick,
    change24h: data.change24h || 0,
    minted: toNumber(data.mintedAmt) / toNumber(data.max),
    topholder: get(topholder, "data", []),
    holders: toNumber(data.holders),
    deployer: data.deployerAddress,
  };
};

const getBalance = async (wallet) => {
  const data = await makeCallAPI(
    `https://api.doggy.market/wallet/${wallet}/balance`
  );

  return data;
};

const getNFT = async (wallet) => {
  const data = await makeCallAPI(
    `https://api.doggy.market/wallet/${wallet}/nfts?offset=0&limit=40`
  );

  const res = filter(
    map(get(data, "data", []), (e) => {
      return {
        name: get(e, "nft.itemName") || `#${get(e, "inscriptionNumber")}`,
      };
    }),
    (x) => !!x.name
  );

  const group = groupBy(res, "name");
  const _keys = keys(group);
  const nfts = map(_keys, (key) => {
    return {
      name: key,
      amount: toArray(group[key]).length,
    };
  });

  return nfts;
};

const getDogmap = async () => {
  const data = await makeCallAPI(`https://api.doggy.market/dogemaps`);

  const recentlyListed = get(data, "recentlyListed", []);

  return {
    floor: formatBalance(get(data, "floorPrice")),
    recently: map(recentlyListed, (e) => {
      return {
        name: get(e, "data"),
        seller: get(e, "sellerAddress"),
        price: formatBalance(get(e, "price")),
      };
    }),
  };
};

const getDogmapListing = async () => {
  const data = await makeCallAPI(
    `https://api.doggy.market/listings/dogemaps?sortBy=price&sortOrder=asc&offset=0&limit=10`
  );
  const recentlyListed = get(data, "data", []);

  return map(recentlyListed, (e) => {
    return {
      name: get(e, "data"),
      seller: get(e, "sellerAddress"),
      price: formatBalance(get(e, "price")),
    };
  });
};

const getMyDogmap = async (wallet) => {
  const res = await makeCallAPI(
    `https://api.doggy.market/wallet/${wallet}/dogemaps?offset=0&limit=40`
  );

  const data = get(res, "data", []);

  return map(data, (e) => {
    return {
      name: get(e, "data"),
      seller: get(e, "sellerAddress"),
      price: formatBalance(get(e, "price")),
    };
  });
};

const getTrending = async () => {
  const data = await makeCallAPI(
    `https://api.doggy.market/token/trending?period=all&offset=0&limit=10`
  );
  const res = get(data, "data", []);

  return map(res, (e) => {
    return {
      tick: get(e, "tick"),
      price: formatBalance(get(e, "lastPrice")),
      change24h: get(e, "change24h"),
      volume24h: formatBalance(get(e, "volume24h")),
      mc: formatBalance(get(e, "marketcap")),
    };
  });
};

const getActivity = async (wallet) => {
  const data = await makeCallAPI(
    `https://api.doggy.market/wallet/${wallet}/activity?offset=0&limit=1000&action=mint`
  );
  const groupedData = groupBy(
    filter(get(data, "data", []), (x) => x.type === "mint"),
    "tick"
  );

  const summedData = mapValues(groupedData, (group) => sumBy(group, "amt"));
  return keys(summedData).map((tick) => {
    return {
      tick,
      amount: formatVND(get(summedData, tick, 0)),
    };
  });
};

// fetch("https://api.doggy.market/buyer/createBuyingPSBT", {
//   "headers": {
//     "content-type": "application/json",
//     "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"macOS\"",
//     "Referer": "https://doggy.market/",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"listingId\":\"658ca55e0af2c767db714ac4\",\"buyerAddress\":\"DJV72uHdFx6UcJzF5G44iLtD54gbch6WqA\",\"buyerTokenReceiveAddress\":\"DJV72uHdFx6UcJzF5G44iLtD54gbch6WqA\"}",
//   "method": "POST"
// });

// fetch("https://api.doggy.market/buyer/buyListing", {
//   "headers": {
//     "content-type": "application/json",
//     "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"macOS\"",
//     "Referer": "https://doggy.market/",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"listingId\":\"658ca55e0af2c767db714ac4\",\"buyerAddress\":\"DJV72uHdFx6UcJzF5G44iLtD54gbch6WqA\",\"buyerTokenReceiveAddress\":\"DJV72uHdFx6UcJzF5G44iLtD54gbch6WqA\",\"signedBuyingPSBTBase64\":\"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\"}",
//   "method": "POST"
// });

module.exports = {
  getListCoin,
  getInfoCoin,
  getBalance,
  getNFT,
  getDogmap,
  getTrending,
  getMyDogmap,
  getActivity,
  getDogmapListing,
};
