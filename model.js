const { UserModel, PremiumModel } = require("./scheme");

const insertUser = async ({ name, wallet }) => {
  try {
    const isExists = await UserModel.findOne({ name }).lean();
    if (!isExists) {
      const user = new UserModel({ name, wallet });
      await user.save();
    } else {
      await UserModel.findByIdAndUpdate(isExists._id, { wallet });
    }
  } catch (error) {
    console.log("error", error);
  }
};

const insertStartUser = async ({ name }) => {
  try {
    const isExists = await UserModel.findOne({ name }).lean();
    if (!isExists) {
      const user = new UserModel({ name, wallet: "" });
      await user.save();
    }
  } catch (error) {
    console.log("error", error);
  }
};

const findCurrentUser = async (name) => {
  const data = await UserModel.findOne({ name }).lean();
  return data;
};

const isUserPremium = async (name) => {
  const data = await PremiumModel.findOne({ name, status: true }).lean();
  return !!data;
};

module.exports = {
  insertUser,
  findCurrentUser,
  isUserPremium,
  insertStartUser,
};
