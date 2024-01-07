require("dotenv").config();

const {
  trim,
  startsWith,
  groupBy,
  mapValues,
  orderBy,
  map,
  slice,
} = require("lodash");
const Mongoose = require("mongoose");
const fs = require("fs");

function readFileToArray() {
  const filePath = "./wl.txt";
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const dataArray = data.split("\n");

    return dataArray;
  } catch (error) {
    console.error("Error reading file:", error.message);
    return [];
  }
}

const seedUser = async (userName) => {
  const { PremiumModel, UserModel } = require("./scheme");
  try {
    const check = await PremiumModel.findOne({ name: userName }).lean();
    if (check) {
      throw Error("user is existed");
    }
    const user = new PremiumModel({ name: userName, status: true });
    await user.save();
    console.log("seed ok: ", userName);
    return true;
  } catch (error) {
    console.log("seed error: " + userName, error);
    return false;
  }
};

const normalizeUserNameTelegram = (name) => {
  const rs = trim(name);
  if (startsWith(rs, "@")) {
    return rs.substring(1);
  }
  return rs;
};

const seedListUser = async () => {
  const WLList = readFileToArray();
  let fail = 0;
  for (let index = 0; index < WLList.length; index++) {
    const userName = normalizeUserNameTelegram(WLList[index]);
    const status = await seedUser(userName);
    if (!status) {
      fail++;
    }
  }

  console.log("Inserted with fail: ", fail);
};

const listRanking = async () => {
  const { PremiumModel, UserModel } = require("./scheme");

  const users = await UserModel.find({ referralCode: { $ne: "" } }).lean();
  const groupedData = groupBy(users, "referralCode");

  const countedData = mapValues(groupedData, (group) => group.length);
  const countedArray = map(countedData, (count, userName) => ({
    userName,
    count,
  }));
  const orderedData = orderBy(countedArray, "count", "desc");
  return slice(
    orderedData.filter((x) => !["AkaiTrading"].includes(x.userName)),
    0,
    10
  );
};

(async () => {
  Mongoose.connect(process.env.DATABASE_URL)
    .then(async () => {
      console.log("Connected");
      require("./scheme");
      // seedUser();
      seedListUser();
      // await listRanking();
    })
    .catch((error) => {
      console.log("Connected error", error);
    });
})();
