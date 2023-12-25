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
