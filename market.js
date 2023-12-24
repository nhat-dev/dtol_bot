process.env.APP_URL = "https://api.xeggex.com/api/v2";
const {
  filter,
  map,
  get,
  toNumber,
  orderBy,
  toUpper,
  slice,
} = require("lodash");
const fetch = require("node-fetch");
const { formatDate } = require("./utils");
function thousandCommas(num) {
  num = toNumber(num).toFixed(0).toString().split(".");
  var ints = num[0].split("").reverse();
  for (var out = [], len = ints.length, i = 0; i < len; i++) {
    if (i > 0 && i % 3 === 0) out.push(",");
    out.push(ints[i]);
  }
  out = out.reverse() && out.join("");
  if (num.length === 2) out += "." + num[1];
  return out;
}
const formatVND = (value) => {
  return thousandCommas(value);
  //  toNumber(value)
  //   .toFixed(0)
  //   .replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

const formatUSD = (value) => {
  return toNumber(value)
    .toFixed(10)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

const formatUSD2 = (value) => {
  return toNumber(value)
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

const getAllCoin = async (trend) => {
  const resp = await fetch(`${process.env.APP_URL}/asset/getlist`, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    method: "GET",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  const pow = filter(data, (e) => !e.isToken);
  const mapData = await Promise.all(
    map(pow, async (e) => {
      const priceData = await getPrice(e.ticker);
      return {
        name: e.name,
        lable: e.ticker,
        network: e.network,
        price: e.usdValue,
        supply: toNumber(e.circulation),
        twitter: get(e, "socialCommunity.Twitter"),
        telegram: get(e, "socialCommunity.Telegram"),
        createdAt: e.createdAt,
        mc: toNumber(e.circulation) * toNumber(e.usdValue),
        ...priceData,
      };
    })
  );
  let mapPow = [];
  if (!trend) {
    mapPow = orderBy(
      filter(
        mapData,
        (e) => e.mc >= 1000 && e.mc < 1000000 && e.createdAt <= 1672417602000
      ),
      ["mc"],
      ["asc"]
    );
  } else {
    mapPow = slice(
      orderBy(
        filter(mapData, (e) => e.mc >= 10000 && e.mc < 10000000),
        ["volume"],
        ["desc"]
      ),
      0,
      10
    );
  }
  return mapPow;
};

const getAllSupperLowCapCoin = async () => {
  const resp = await fetch(`${process.env.APP_URL}/asset/getlist`, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    method: "GET",
    mode: "cors",
    credentials: "omit",
  });

  const pow = await resp.json();
  const mapData = await Promise.all(
    map(pow, async (e) => {
      const priceData = await getPrice(e.ticker);
      return {
        name: e.name,
        lable: e.ticker,
        network: e.network,
        price: e.usdValue,
        supply: toNumber(e.circulation),
        twitter: get(e, "socialCommunity.Twitter"),
        telegram: get(e, "socialCommunity.Telegram"),
        createdAt: e.createdAt,
        mc: toNumber(e.circulation) * toNumber(e.usdValue),
        ...priceData,
      };
    })
  );
  let mapPow = [];

  mapPow = orderBy(
    filter(mapData, (e) => e.mc >= 1000 && e.mc < 20000),
    ["volume"],
    ["desc"]
  );

  return mapPow;
};

const getPrice = async (label) => {
  // https://api.xeggex.com/api/v2/market/getbysymbol/BBC_USDT
  const resp = await fetch(
    `${process.env.APP_URL}/market/getbysymbol/${toUpper(label)}_USDT`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
      },
      method: "GET",
      mode: "cors",
      credentials: "omit",
    }
  );

  const data = await resp.json();

  return {
    price: get(data, "bestBidNumber"),
    volume: get(data, "volumeUsdNumber"),
    mc: get(data, "marketcapNumber"),
    change: get(data, "changePercent"),
  };
};

const getCoinByTicker = async (label) => {
  const resp = await fetch(
    `${process.env.APP_URL}/asset/getbyticker/${label}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
      },
      method: "GET",
      mode: "cors",
      credentials: "omit",
    }
  );

  const e = await resp.json();
  const pow = [
    {
      name: e.name,
      lable: e.ticker,
      network: e.network,
      price: e.usdValue,
      supply: toNumber(e.circulation),
      twitter: get(e, "socialCommunity.Twitter"),
      telegram: get(e, "socialCommunity.Telegram"),
      createdAt: e.createdAt,
      mc: toNumber(e.circulation) * toNumber(e.usdValue),
      type: e.isProofOfWork ? "POW" : "POS",
    },
  ];

  const mapData = await Promise.all(
    map(pow, async (item) => {
      const priceData = await getPrice(e.ticker);
      return {
        ...item,
        ...priceData,
      };
    })
  );

  return mapData;
};

module.exports = {
  getAllCoin,
  formatVND,
  getCoinByTicker,
  formatUSD,
  getAllSupperLowCapCoin,
  formatUSD2,
};
