// 1. Check giá (price) token bất kì - biến đổi 24h (%)
// 2. Check top 10 (top) token: giá - volume - cap - holder
// 3. check infor token :
// Inscription address

// Deployer address

// Deployed at

// Holders (số lượng holder - top 20 holder đầu tiên)

// 4. Check ví: các token đang hold - NFT
// 5. (quan trọng) Check ví:
// - các transfer
// - lịch sử mua bán
// - Lịch sử deploy, mint coin
// 6. Check giá floor Dogemap (theo sub - độ hiếm )

const express = require("express");
const expressApp = express();
const axios = require("axios");
const _ = require("lodash");
expressApp.use(express.json());
require("dotenv").config();
const { message } = require("telegraf/filters");
const utils = require("./utils");
const markets = require("./market");
const mongoose = require("mongoose");

const { Telegraf, Markup, session } = require("telegraf");
const {
  getListCoin,
  getInfoCoin,
  getBalance,
  getNFT,
  getDogmap,
  getTrending,
  getMyDogmap,
  getActivity,
} = require("./drc20");
const { formatBalance } = require("./formatter");
const {
  insertUser,
  findCurrentUser,
  isUserPremium,
  insertStartUser,
  getReferrals,
} = require("./model");

function formatWalletAddress(
  walletAddress,
  prefixLength = 6,
  suffixLength = 6
) {
  walletAddress = walletAddress.toString();
  const prefix = walletAddress.substring(0, prefixLength);
  const suffix = walletAddress.slice(-suffixLength);
  const formattedAddress = `${prefix}...${suffix}`;

  return formattedAddress;
}

mongoose
  .connect(process.env.DATABASE_URL)
  .then(async () => {
    console.log("Connected");
    require("./scheme");
    // require("./seed");
  })
  .catch(() => {
    console.log("Connected error");
  });

const APP_TITLE = "DRC-20 x Digital Bot";

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(async (ctx) => {
  const referralCode = ctx.payload;
  console.log("referralCode", referralCode);
  const user = _.get(ctx.message, "chat.username", "");
  await insertStartUser({ name: user, referralCode });
  return ctx.replyWithHTML(
    `<b>${APP_TITLE}</b>\n\nWelcome! DXDB is a revolutionary Telegram bot for the DRC-20 ecosystem, simplifying user experiences and making it easier to find information and trade.
    DXDB was created to make the DRC-20 protocol more user-friendly and accessible. It aims to build a stronger and more vibrant Inscription ecosystem in the future.`
  );
});
// bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));
const INVALID_USER_WHITE_LIST =
  "The user is not whitelisted, please contact the administrator.";
const INVALID_GROUP_CHAT = "This command is invalid in a group chat!";
const SET_WALLET_CMD =
  "Please set your wallet using the command /setwallet <<address wallet>>.";
const wallets = {};

bot.use(session());

bot.command("price", async (ctx) => {
  let token = _.trim(_.get(_.split(ctx.message.text, " "), "1"));
  if (!token) {
    return ctx.reply("Invalid token! Please type the example: /price dugi.");
  }
  // const isPremium = await isUserTelegramPremium(ctx);
  // if (!isPremium) {
  //   return ctx.reply(
  //     "The user is not whitelisted; please contact the administrator."
  //   );
  // }

  try {
    const item = await getInfoCoin(_.toLower(token));
    if (!item.tick) {
      throw Error("Token not found.");
    }
    const keyboard = Markup.inlineKeyboard(
      [
        Markup.button.url(
          `Buy/Sell ${item.tick}`,
          `https://doggy.market/${item.tick}`
        ),
        Markup.button.url(`Launch Bot $DXDB`, `https://t.me/drc20digital_bot`),
      ],
      {
        columns: 1,
      }
    );
    const html = `<b>${APP_TITLE}</b>\n🐶 <b>${
      item.tick
    }</b> 🐶\n\n💵 <b>Price</b>: ${markets.formatUSD(
      _.toNumber(item.price)
    )} DOGE\n⬆️ <b>24 Change</b>: ${markets.formatUSD2(
      _.toNumber(item.change24h) * 100
    )}% \n👥 <b>Minted</b>: ${markets.formatUSD2(
      _.toNumber(item.minted) * 100
    )}% \n👤 <b>Deployer</b>: ${formatWalletAddress(
      item.deployer
    )} \n👥 <b>Holders</b>: ${markets.formatVND(
      item.holders
    )} \n💸 <b>Market Cap</b>: ${markets.formatVND(
      _.toNumber(item.mc)
    )} $\n🔀 <b>Supply</b>: ${markets.formatVND(
      _.toNumber(item.supply)
    )}\n\n<b>🏆 Top holders</b>\n${_.map(item.topholder, (t) => {
      return `- ${formatWalletAddress(t.address)}`;
    }).join("\n")}\n\n

`;
    ctx.replyWithHTML(html, keyboard);
  } catch (error) {
    return ctx.reply("Invalid token! Please type the example: /price dugi.");
  }
});

bot.command("setwallet", async (ctx) => {
  const isGroup = isMessageFromGroup(ctx);
  if (isGroup) {
    return ctx.reply(INVALID_GROUP_CHAT);
  }
  const isPremium = await isUserTelegramPremium(ctx);
  if (!isPremium) {
    return ctx.reply(
      "The user is not whitelisted; please contact the administrator."
    );
  }

  console.log("setwallet", ctx.message);
  const user = _.get(ctx.message, "chat.username", "");
  let wallet = ctx.payload;
  if (!wallet) {
    return ctx.reply("Invalid wallet!");
  }
  await insertUser({ name: user, wallet });
  // _.assign(wallets, { [user]: wallet });
  return ctx.reply(`Wallet set successfully for user ${user}!`);
});

const getCurrentWallet = async (ctx) => {
  const user = _.get(ctx.message, "chat.username", "");
  const data = await findCurrentUser(user);
  return _.get(data, "wallet", "");
};

const getCurrentWalletInCtx = (ctx) => {
  const wallet = `${ctx.message.text}`;
  if (!wallet.startsWith("D") || wallet.length < 34) return null;
  return wallet;
};

const getCurrentTokenInCtx = (ctx) => {
  const wallet = `${ctx.message.text}`;
  return wallet;
};

function isNumeric(str) {
  // Use parseFloat to convert the string to a number
  // and then use isNaN to check if it's NaN
  return !isNaN(parseFloat(str)) && isFinite(str);
}

const getCurrentAmountCtx = (ctx) => {
  const amount = `${ctx.message.text}`;
  if (isNumeric(amount)) return amount;
  return null;
};

const getCurrentCommandWallet = async (ctx) => {
  console.log("aaa", ctx.update);
  const user = _.get(ctx.update, "callback_query.from.username", "");
  const data = await findCurrentUser(user);
  return _.get(data, "wallet", "");
};

const isMessageFromGroup = (ctx) => {
  const chat = _.get(ctx.message, "chat.type", "");
  return chat === "supergroup";
};

const isUserTelegramPremiumCtx = async (ctx) => {
  const user = _.get(ctx.update, "callback_query.from.username", "");
  const isPremium = await isUserPremium(user);
  return isPremium;
};

const getUserTelegram = (ctx) => {
  const user = _.get(ctx.update, "callback_query.from.username", "");
  return user;
};

const isUserTelegramPremium = async (ctx) => {
  const user = _.get(ctx.message, "chat.username", "");
  const isPremium = await isUserPremium(user);
  return isPremium;
};

const accessBot = (ctx) => {
  const keyboard1 = Markup.inlineKeyboard(
    [
      Markup.button.url(
        `Buy 1,000 $DXDB to access the bot.`,
        `https://doggy.market/dxdb`
      ),
    ],
    {
      columns: 2,
    }
  );
  return ctx.reply(INVALID_USER_WHITE_LIST, keyboard1);
};

bot.command("menu", async (ctx) => {
  const isGroup = isMessageFromGroup(ctx);
  if (isGroup) {
    return ctx.reply(INVALID_GROUP_CHAT);
  }

  // const isPremium = await isUserTelegramPremium(ctx);
  // if (!isPremium) {
  //   return accessBot(ctx);
  // }

  console.log("ctx", ctx.message);
  const wallet = await getCurrentWallet(ctx);
  const messageText = `
  <b>${APP_TITLE}</b>\n
========= Your wallet =========
Main: ${wallet}
  `;

  // Creating a button
  const keyboard = Markup.inlineKeyboard(
    [
      Markup.button.callback("🪙 Porfolio Tracker", "porfolio_tracked"),
      Markup.button.callback("⚖ Your Balance", "your_balance"),
      Markup.button.callback("🖼 Your NFT", `your_nft:${wallet}`),
      Markup.button.callback("🐶 Dogemap", "top_listed_dogemap"),
      Markup.button.callback("📈 Top trending", "top_trending"),
      Markup.button.callback("✅ Check wallet", "track_wallet"),
      Markup.button.callback("🔑 Check token", "track_token"),
      Markup.button.callback("📝 Inscribe Transfer", "inscriptions"),
      Markup.button.callback("🐳 Buy Inscriptions", "buy_inscriptions"),
      Markup.button.callback("🐻 Sell Inscriptions", "sell_inscriptions"),
      Markup.button.callback("👥 Referral", "referral"),
    ],
    {
      columns: 2,
    }
  );

  // Replying to the message with the button
  ctx.replyWithHTML(messageText, keyboard);
});

bot.action("track_wallet", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackWallet";
  ctx.reply("Please enter the wallet address you'd like to check.");
});

bot.action("inscriptions", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  // ctx.reply("Oops! This feature is coming soon...");
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackInscriptionWallet";
  ctx.reply("Please enter the name of the token you want to inscribe:");
});

bot.action("buy_inscriptions", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  // ctx.reply("Oops! This feature is coming soon...");
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackBuyInscriptionWallet";
  ctx.reply("Please enter the name of the token you want to buy:");
});

bot.action("sell_inscriptions", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  // ctx.reply("Oops! This feature is coming soon...");
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackSellInscriptionWallet";
  ctx.reply("Please enter the name of the token you want to sell:");
});

const Referral_Amount = 50;

bot.action("referral", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  const user = getUserTelegram(ctx);
  const botName = _.get(ctx, "botInfo.username", "");
  const userReferrals = await getReferrals({ name: user });
  if (!isPremium) {
    return accessBot(ctx);
  }
  ctx.replyWithHTML(`<b>👥 Referral Info</b>\n\nReferrals: ${userReferrals}\nReferrals 🐶: ${markets.formatVND(
    userReferrals * Referral_Amount
  )} $DXDB\n\n📈 Get Referral link 📉<pre>https://t.me/${botName}?start=${user}</pre>
  `);
});

bot.action("track_token", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackToken";
  ctx.reply(
    "Please enter the name of the token you want to check. Example: dogi"
  );
});

const errorSession = (ctx, errorMessage) => {
  const keyboard = Markup.inlineKeyboard(
    [Markup.button.callback("✖ Cancel", "cancel_session")],
    {
      columns: 2,
    }
  );
  return ctx.reply(errorMessage, keyboard);
};

bot.on("text", async (ctx) => {
  const state = _.get(ctx.session, "state", "");
  if (state === "waitingForTrackWallet") {
    const wallet = await getCurrentWalletInCtx(ctx);
    if (!wallet) {
      return errorSession(ctx, "Invalid wallet, please give it another try.");
    }
    const html = await getPorfolio(wallet);
    const keyboard = Markup.inlineKeyboard(
      [
        Markup.button.callback("🖼 NFT", `your_nft:${wallet}`),
        Markup.button.callback("🐶 Dogemap", `dogemap:${wallet}`),
        Markup.button.callback("🕐 History mint", `history_mint:${wallet}`),
      ],
      {
        columns: 2,
      }
    );
    ctx.replyWithHTML(html, keyboard);
    delete ctx.session.state;
  } else if (state === "waitingForTrackToken") {
    const token = getCurrentTokenInCtx(ctx);
    if (!token) {
      return errorSession(ctx, "Invalid token, please give it another try.");
    }

    try {
      const item = await getInfoCoin(_.toLower(token));
      if (!item.tick) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      const keyboard = Markup.inlineKeyboard(
        [
          Markup.button.url(
            `Buy/Sell ${item.tick}`,
            `https://doggy.market/${item.tick}`
          ),
        ],
        {
          columns: 2,
        }
      );
      const html = `<b>${APP_TITLE}</b>\n🐶 <b>${
        item.tick
      }</b> 🐶\n\n💵 <b>Price</b>: ${markets.formatUSD(
        _.toNumber(item.price)
      )} DOGE\n⬆️ <b>24 Change</b>: ${markets.formatUSD2(
        _.toNumber(item.change24h) * 100
      )}% \n👥 <b>Minted</b>: ${markets.formatUSD2(
        _.toNumber(item.minted) * 100
      )}% \n👤 <b>Deployer</b>: ${formatWalletAddress(
        item.deployer
      )} \n👥 <b>Holders</b>: ${markets.formatVND(
        item.holders
      )} \n💸 <b>Market Cap</b>: ${markets.formatVND(
        _.toNumber(item.mc)
      )} $\n🔀 <b>Supply</b>: ${markets.formatVND(
        _.toNumber(item.supply)
      )}\n\n<b>🏆 Top holders</b>\n${_.map(item.topholder, (t) => {
        return `- ${formatWalletAddress(t.address)}`;
      }).join("\n")}\n\n
  
  `;
      ctx.replyWithHTML(html, keyboard);
      delete ctx.session.state;
    } catch (error) {
      return errorSession(ctx, "Invalid token, please give it another try.");
    }
  } else if (state === "waitingForTrackInscriptionWallet") {
    try {
      const token = getCurrentTokenInCtx(ctx);
      if (!token) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      const item = await getInfoCoin(_.toLower(token));
      if (!item.tick) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      ctx.session ??= { state: "" };
      ctx.session.state = "waitingForTrackInscriptionAmountWallet";
      ctx.reply(`Please enter the amount of ${token} you want to inscribe:`);
    } catch (error) {
      return errorSession(ctx, "Invalid token, please give it another try.");
    }
  } else if (state === "waitingForTrackInscriptionAmountWallet") {
    const amount = getCurrentAmountCtx(ctx);
    if (!amount) {
      return errorSession(ctx, "Invalid amount, please give it another try.");
    }

    ctx.reply("Oops! This feature is coming soon...");
    delete ctx.session.state;
  } else if (state === "waitingForTrackBuyInscriptionWallet") {
    try {
      const token = getCurrentTokenInCtx(ctx);
      if (!token) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      const item = await getInfoCoin(_.toLower(token));
      if (!item.tick) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      ctx.session ??= { state: "" };
      ctx.session.state = "waitingForTrackBuyInscriptionAmountWallet";
      ctx.reply(`Please enter the amount of ${token} you want to buy:`);
    } catch (error) {
      return errorSession(ctx, "Invalid token, please give it another try.");
    }
  } else if (state === "waitingForTrackBuyInscriptionAmountWallet") {
    const amount = getCurrentAmountCtx(ctx);
    if (!amount) {
      return errorSession(ctx, "Invalid amount, please give it another try.");
    }

    ctx.reply("Oops! This feature is coming soon...");
    delete ctx.session.state;
  } else if (state === "waitingForTrackSellInscriptionWallet") {
    try {
      const token = getCurrentTokenInCtx(ctx);
      if (!token) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      const item = await getInfoCoin(_.toLower(token));
      if (!item.tick) {
        return errorSession(ctx, "Invalid token, please give it another try.");
      }
      ctx.session ??= { state: "" };
      ctx.session.state = "waitingForTrackSellInscriptionAmountWallet";
      ctx.reply(`Please enter the amount of ${token} you want to sell:`);
    } catch (error) {
      return errorSession(ctx, "Invalid token, please give it another try.");
    }
  } else if (state === "waitingForTrackSellInscriptionAmountWallet") {
    const amount = getCurrentAmountCtx(ctx);
    if (!amount) {
      return errorSession(ctx, "Invalid amount, please give it another try.");
    }

    ctx.reply("Oops! This feature is coming soon...");
    delete ctx.session.state;
  }
});

bot.action("cancel_session", (ctx) => {
  delete ctx.session.state;
  ctx.reply("Please check /menu to see more");
});

const getPorfolio = async (wallet) => {
  const coins = await getListCoin(wallet);
  const html = `
      <b>🪙 Your porfolio:</b>\n${_.map(coins, (item) => {
        return `- <b>Ticker: ${item.tick}</b> - Amount: ${markets.formatVND(
          _.toNumber(item.available + item.inscribed)
        )}`;
      }).join("\n")}
  
  `;

  return html;
};

// Handling button click
bot.action("porfolio_tracked", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  const wallet = await getCurrentCommandWallet(ctx);
  if (!wallet) return ctx.reply(SET_WALLET_CMD);

  const html = await getPorfolio(wallet);
  ctx.replyWithHTML(html);
});

bot.action("your_balance", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  const wallet = await getCurrentCommandWallet(ctx);

  if (!wallet) return ctx.reply(SET_WALLET_CMD);

  const data = await getBalance(wallet);
  console.log("Data", JSON.stringify(data));
  ctx.replyWithHTML(
    `<b>⚖ Your balance:</b> ${formatBalance(_.get(data, "balance"))} DOGE`
  );
});

const replyNFT = async (wallet, ctx) => {
  const data = await getNFT(wallet);
  const keyboard1 = Markup.inlineKeyboard(
    [
      Markup.button.url(
        `See more NFTs`,
        `https://doggy.market/wallet/${wallet}/nfts`
      ),
    ],
    {
      columns: 2,
    }
  );
  ctx.replyWithHTML(
    `<b>🖼 Your NFT List: ${wallet}</b>\n${_.map(data, (e) => {
      return `- Name: ${_.get(e, "name", "")} - Amount: ${_.get(
        e,
        "amount",
        ""
      )}`;
    }).join("\n")}`,
    keyboard1
  );
};

bot.action(/.+/, async (ctx, next) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  const cm = ctx.match[0];
  if (cm.startsWith("your_nft")) {
    const wallet = _.last(cm.split(":"));
    if (!wallet) return ctx.reply(SET_WALLET_CMD);

    await replyNFT(wallet, ctx);
  } else if (cm.startsWith("dogemap")) {
    const wallet = _.last(cm.split(":"));
    const data = await getMyDogmap(wallet);

    return ctx.replyWithHTML(
      `<b>🐶 Dogemap: ${wallet}</b>\n${
        data.length === 0
          ? "Not found"
          : _.map(data, (e) => {
              return `- <b>${_.get(e, "name", "")}</b>`;
            }).join("\n")
      }`
    );
  } else if (cm.startsWith("history_mint")) {
    const wallet = _.last(cm.split(":"));
    const data = await getActivity(wallet);
    return ctx.replyWithHTML(
      `<b>🕐 History mint: ${wallet}</b>\n${
        data.length === 0
          ? "Not found"
          : _.map(data, (e) => {
              return `- <b>Ticker: ${_.get(
                e,
                "tick",
                ""
              )}</b> - Amount: ${_.get(e, "amount", "")}`;
            }).join("\n")
      }`
    );
  }
  next();
});

bot.action("your_nft", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  console.log("aaaa", ctx);
  const paramValue = ctx.match[1];
  const wallet = paramValue || getCurrentCommandWallet(ctx);

  if (!wallet) return ctx.reply(SET_WALLET_CMD);

  await replyNFT(wallet, ctx);
});

bot.action("top_listed_dogemap", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  const wallet = getCurrentCommandWallet(ctx);

  if (!wallet) return ctx.reply(SET_WALLET_CMD);

  const data = await getDogmap(wallet);
  const keyboard = Markup.inlineKeyboard(
    [Markup.button.url("Buy dogemap", "https://doggy.market/dogemaps")],
    {
      columns: 2,
    }
  );
  ctx.replyWithHTML(
    `<b>🐶 Dogemap:</b>\n📈 Floor: ${_.get(
      data,
      "floor",
      ""
    )} DOGE \nRecently Listed:\n${_.map(data.recently, (e) => {
      return `- <b>${_.get(e, "name", "")}</b> = ${_.get(e, "price", "")} DOGE`;
    }).join("\n")}`,
    keyboard
  );
});

bot.action("top_trending", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return accessBot(ctx);
  }
  const wallet = getCurrentCommandWallet(ctx);

  if (!wallet) return ctx.reply(SET_WALLET_CMD);

  const data = await getTrending(wallet);
  ctx.replyWithHTML(
    `<b>📈 Top trending:</b>\n${_.map(data, (e) => {
      return `💠 <b>Ticker: ${e.tick}</b> - ${e.price} DOGE - ${
        e.change24h > 0 ? "📈" : "📉"
      } 24h: ${(e.change24h * 100).toFixed(2)}%`;
    }).join("\n")}`
  );
});

try {
  bot.launch();
} catch (error) {}
