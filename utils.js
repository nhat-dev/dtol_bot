const {
  compact,
  get,
  map,
  orderBy,
  sortBy,
  toArray,
  toNumber,
} = require("lodash");
const moment = require("moment");
const fetch = require("node-fetch");

const wheelSpin = [
  "Nothing",
  "2000 point",
  "1 point",
  "100 point",
  "500 point",
  "Shield",
];

const EnumScore = 1.0000016e12;

const PointScore = 9.6471993e17;

const graphQLQuery = async (query, variables) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query,
      variables,
    }),
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  return data;
};

const queryMarket = async () => {};

const fetchData = async (query, variables) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query,
      variables,
    }),
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  return get(data, "data.pets", []);
};

const getRefs = async (owner) => {
  const reps = await fetch(`https://frenpet.xyz/api/invite/${owner}`);
  const data = await reps.json();
  const invites = get(data, "0.invites", []);
  const people = await Promise.all(
    map(invites, async (inv) => {
      if (inv.used) {
        const usedBy = await fetchData(`
      query GetAllPets {
        pets (first: 1000, where: {owner: "${inv.usedBy}" }, orderBy: "level", orderDirection: "desc") {
          name
          id
          owner
          score
          timeUntilStarving
          status 
          lastAttackUsed
          lastAttacked
          level
        }
        }`);
        const user = get(usedBy, "0");

        return user;
      }
      return null;
    })
  );

  return people;
};

const getConsumeds = async (petId) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{"query":"\\n    query GetAllConsumed ($id: Int!) {\\n        consumeds  (first:10,\\n               where: {petId: $id}\\n          orderBy: \\"createdAt\\",\\n          orderDirection: \\"desc\\") { \\n          id\\n          itemId {\\n            id\\n     name\\n     }\\n          giver\\n          pet { \\n            id\\n            name\\n          }\\n          createdAt\\n        }\\n      \\n      }\\n             ","variables":{"id":${petId}}}`,
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  const consumeds = toArray(get(data.data, "consumeds", [])).map((item) => ({
    ...item,
    type: "consumeds",
  }));

  return consumeds;
};

const getWheel = async (petId) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{\"query\":\"\\n    query QuerySpinWheel  ($id: Int!) {\\n      wheelSpins  (first:10,\\n      orderBy: \\\"createdAt\\\",\\n      orderDirection: \\\"desc\\\"\\n      where: {petId: $id}\\n      )  {\\n        winningNumber\\n         pet {\\n           id\\n           name\\n         }\\n         createdAt\\n        }\\n      } \",\"variables\":{\"id\":${petId}}}`,
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  const consumeds = toArray(get(data.data, "wheelSpins", [])).map((item) => ({
    ...item,
    type: "wheel",
  }));

  return consumeds;
};

const getBonk = async (petId) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{\"query\":\"\\n\\tquery GetAllAttacks ($id: Int!)\\n   { \\n\\t\\tattacks  (first:10,\\n    where: {attackerId: $id}, \\n    orderBy: \\\"createdAt\\\",\\n    orderDirection: \\\"desc\\\")  {\\n      createdAt\\n      attacker {\\n        id\\n        name\\n      }\\n      winner {\\n        id\\n        name\\n   score   }\\n       loser {\\n        id\\n        name\\n   score   }\\n      won\\n\\t\\t  }\\n\\t  }\\n\\t\\t\\t\\t   \",\"variables\":{\"id\":${petId}}}`,
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  const consumeds = toArray(get(data.data, "attacks", [])).map((item) => ({
    ...item,
    type: "attacks",
    user:
      get(item, "attacker.id") === get(item, "winner.id")
        ? get(item, "loser")
        : get(item, "winner"),
    status:
      get(item, "attacker.id") === get(item, "winner.id") ? "thắng" : "thua",
    point: get(item, "won"),
  }));

  return consumeds;
};

const getLoser = async (petId) => {
  const resp = await fetch(process.env.BASE_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
    referrer: "https://frenpet.xyz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{\"query\":\"\\n\\tquery GetAllAttacks ($id: Int!)\\n   { \\n\\t\\tattacks  (where: {loserId: $id}, \\n    orderBy: \\\"createdAt\\\",\\n    orderDirection: \\\"desc\\\")  {\\n      createdAt\\n      attacker {\\n        id\\n        name\\n   level\\n    }\\n      winner {\\n        id\\n        name\\n      }\\n       loser {\\n        id\\n        name\\n      }\\n      won\\n\\t\\t  }\\n\\t  }\\n\\t\\t\\t\\t   \",\"variables\":{\"id\":${petId}}}`,
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });

  const data = await resp.json();
  const consumeds = toArray(get(data.data, "attacks", [])).map((item) => ({
    ...item,
    type: "loser",
    point: get(item, "won"),
  }));

  return consumeds;
};

const getActivity = async (petId) => {
  const [consumeds, wheel, attacks, losers] = await Promise.all([
    getConsumeds(petId),
    getWheel(petId),
    getBonk(petId),
    getLoser(petId),
  ]);
  return orderBy(
    [...consumeds, ...wheel, ...attacks, ...losers],
    ["createdAt"],
    ["desc"]
  );
};

const formatPoint = (value) => {
  return (toNumber(value) / PointScore).toFixed(6);
};

const formatScore = (value) => {
  return (toNumber(value) / EnumScore).toFixed(2);
};

const formatDate = (value) => {
  return moment(value).format("MM/DD/YYYY HH:mm:ss");
};

const getData = async (id) => {
  let item = null;
  let refs = [];
  let activity = [];

  let petlist = [];

  if (id) {
    let cond = "";
    if (`${id}`.startsWith("0x")) {
      cond = `owner: "${id}" `;
    } else {
      cond = `id_in: [${id}] `;
    }
    const data = await fetchData(`
      query GetAllPets {
        pets (first: 1000, where: {${cond}}, orderBy: "level", orderDirection: "desc") {
          name
          id
          owner
          score
          timeUntilStarving
          status 
          lastAttackUsed
          lastAttacked
          level
          rewards
          dna
        }
        }`);

    if (`${id}`.startsWith("0x")) {
      refs = await getRefs(id);
    }
    // activity = await getActivity(get(item, "id"));

    petlist = await Promise.all(
      map(data, async (p) => {
        return {
          item: p,
          activity: await getActivity(get(p, "id")),
        };
      })
    );
  }

  return petlist;
};

module.exports = {
  getData,
  formatPoint,
  formatDate,
};
