const { PremiumModel } = require("./scheme");

(async () => {
  try {
    const user = new PremiumModel({ name: "AkaiTrading", status: true });
    await user.save();
    console.log("seed ok");
  } catch (error) {
    console.log("seed error", error);
  }
})();
