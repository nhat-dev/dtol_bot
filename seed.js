require("dotenv").config();

const Mongoose = require("mongoose");

const seedUser = async () => {
  const { PremiumModel } = require("./scheme");
  try {
    const user = new PremiumModel({ name: "H4mze24", status: true });
    await user.save();
    console.log("seed ok");
  } catch (error) {
    console.log("seed error", error);
  }
};

(async () => {
  Mongoose.connect(process.env.DATABASE_URL)
    .then(async () => {
      console.log("Connected");
      require("./scheme");
      seedUser();
    })
    .catch((error) => {
      console.log("Connected error");
    });
})();
