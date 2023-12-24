const mongoose = require("mongoose");

const userSchemes = new mongoose.Schema({
  name: String,
  wallet: String,
});

const UserModel = mongoose.model("User", userSchemes);

const premiumScheme = new mongoose.Schema({
  name: String,
  status: Boolean,
});

const PremiumModel = mongoose.model("Premium", premiumScheme);

module.exports = {
  UserModel,
  PremiumModel,
};
