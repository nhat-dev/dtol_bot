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

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(async (ctx) => {
  const user = _.get(ctx.message, "chat.username", "");
  await insertStartUser({ name: user });
  return ctx.replyWithHTML(
    `<b>Fbod DRC-20 Bot</b>\n\nWelcome! Fbod is a revolutionary telegram bot on the DRC20 ecosystem. \nFbod makes trading inscriptions more seamless and convenient. `
  );
});
// bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));

const wallets = {
  // AkaiTrading: "DMWLKaJnrDj7JxoeaUxc2foQAkw4AZfbkC",
};

bot.use(session());

bot.command("drc20", async (ctx) => {
  let token = _.trim(_.get(_.split(ctx.message.text, " "), "1"));
  if (!token) {
    return ctx.reply("Token invalid! Type example /drc20 dugi");
  }
  const isPremium = await isUserTelegramPremium(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }

  try {
    const item = await getInfoCoin(_.toLower(token));
    if (!item.tick) {
      throw Error("Not found token");
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
    const html = `<b>DRC-20 coin tracking</b>\n💰 <b>Token: ${
      item.tick
    }</b>\n\n🔹 Price       ${markets.formatUSD(
      _.toNumber(item.price)
    )} DOGE\n🔹 24 Change     ${markets.formatUSD2(
      _.toNumber(item.change24h) * 100
    )}% \n🔹 Minted     ${markets.formatUSD2(
      _.toNumber(item.minted) * 100
    )}% \n🔹 Deployer     ${formatWalletAddress(
      item.deployer
    )} \n🔹 Holders     ${markets.formatVND(
      item.holders
    )}% \n🔹 Mkt Cap     ${markets.formatVND(
      _.toNumber(item.mc)
    )} $\n🔹 Supply      ${markets.formatVND(
      _.toNumber(item.supply)
    )}\n\n<b>🏆 Top holders</b>\n${_.map(item.topholder, (t) => {
      return `- ${formatWalletAddress(t.address)}`;
    }).join("\n")}\n\n

`;
    ctx.replyWithHTML(html, keyboard);
  } catch (error) {
    return ctx.reply("Token invalid! Type example /drc20 dugi");
  }
});

bot.command("setwallet", async (ctx) => {
  const isGroup = isMessageFromGroup(ctx);
  if (isGroup) {
    return ctx.reply("Command invalid in group chat!");
  }
  const isPremium = await isUserTelegramPremium(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }

  console.log("setwallet", ctx.message);
  const user = _.get(ctx.message, "chat.username", "");
  let wallet = ctx.payload;
  if (!wallet) {
    return ctx.reply("Wallet invalid!");
  }
  await insertUser({ name: user, wallet });
  // _.assign(wallets, { [user]: wallet });
  return ctx.reply(`Set Wallet for user ${user} successfully!`);
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

const isUserTelegramPremium = async (ctx) => {
  const user = _.get(ctx.message, "chat.username", "");
  const isPremium = await isUserPremium(user);
  return isPremium;
};

bot.command("menu", async (ctx) => {
  const isGroup = isMessageFromGroup(ctx);
  if (isGroup) {
    return ctx.reply("Command invalid in group chat!");
  }

  const isPremium = await isUserTelegramPremium(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }

  console.log("ctx", ctx.message);
  const wallet = await getCurrentWallet(ctx);
  const messageText = `
  <b>DRC-20 coin tracking</b>\n
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
      Markup.button.callback("🐳 Buy Inscriptions", "inscriptions"),
      Markup.button.callback("🐻 Sell Inscriptions", "inscriptions"),
    ],
    {
      columns: 2,
    }
  );

  // Replying to the message with the button
  ctx.replyWithHTML(messageText, keyboard);
});

bot.action("track_wallet", async (ctx) => {
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackWallet";
  ctx.reply("Enter the wallet address you want to check ?");
});

bot.action("inscriptions", (ctx) => {
  ctx.reply("Ops! Comming soon...");
});

bot.action("track_token", async (ctx) => {
  ctx.session ??= { state: "" };
  ctx.session.state = "waitingForTrackToken";
  ctx.reply("Enter the token's name you want to check ? Ex: dogi");
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
      return errorSession(ctx, "Wallet invalid, please try again");
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
      return errorSession(ctx, "Token invalid, please try again");
    }

    try {
      const item = await getInfoCoin(_.toLower(token));
      if (!item.tick) {
        throw Error("Not found token");
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
      const html = `<b>DRC-20 coin tracking</b>\n💰 <b>Token: ${
        item.tick
      }</b>\n\n🔹 Price       ${markets.formatUSD(
        _.toNumber(item.price)
      )} DOGE\n🔹 24 Change     ${markets.formatUSD2(
        _.toNumber(item.change24h) * 100
      )}% \n🔹 Minted     ${markets.formatUSD2(
        _.toNumber(item.minted) * 100
      )}% \n🔹 Deployer     ${formatWalletAddress(
        item.deployer
      )} \n🔹 Holders     ${markets.formatVND(
        item.holders
      )}% \n🔹 Mkt Cap     ${markets.formatVND(
        _.toNumber(item.mc)
      )} $\n🔹 Supply      ${markets.formatVND(
        _.toNumber(item.supply)
      )}\n\n<b>🏆 Top holders</b>\n${_.map(item.topholder, (t) => {
        return `- ${formatWalletAddress(t.address)}`;
      }).join("\n")}\n\n
  
  `;
      ctx.replyWithHTML(html, keyboard);
      delete ctx.session.state;
    } catch (error) {
      return errorSession(ctx, "Token invalid, please try again");
    }
  }
});

bot.action("cancel_session", (ctx) => {
  delete ctx.session.state;
  ctx.reply("Hi, what do you do ?");
});

const getPorfolio = async (wallet) => {
  const coins = await getListCoin(wallet);
  const html = `
      <b>🪙 Your porfolio:</b>\n${_.map(coins, (item) => {
        return `- <b>Tick: ${item.tick}</b> - Amount: ${markets.formatVND(
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
    return ctx.reply("User is not whitelist, please contact admin");
  }
  const wallet = await getCurrentCommandWallet(ctx);
  if (!wallet)
    return ctx.reply(
      "Please set your wallet with command /setwallet <mywallet>"
    );

  const html = await getPorfolio(wallet);
  ctx.replyWithHTML(html);
});

bot.action("your_balance", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }
  const wallet = await getCurrentCommandWallet(ctx);

  if (!wallet)
    return ctx.reply(
      "Please set your wallet with command /setwallet <mywallet>"
    );

  const data = await getBalance(wallet);
  console.log("Data", JSON.stringify(data));
  ctx.replyWithHTML(
    `<b>⚖ Your balance:</b> ${formatBalance(_.get(data, "balance"))} DOGE`
  );
});

const replyNFT = async (wallet, ctx) => {
  const data = await getNFT(wallet);
  ctx.replyWithHTML(
    `<b>🖼 Your NFT List: ${wallet}</b>\n${_.map(data, (e) => {
      return `- Name: ${_.get(e, "name", "")} Amount: ${_.get(
        e,
        "amount",
        ""
      )}`;
    }).join("\n")}`
  );
};

bot.action(/.+/, async (ctx, next) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }
  const cm = ctx.match[0];
  if (cm.startsWith("your_nft")) {
    const wallet = _.last(cm.split(":"));
    if (!wallet)
      return ctx.reply(
        "Please set your wallet with command /setwallet <mywallet>"
      );

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
              return `- <b>Tick: ${_.get(e, "tick", "")}</b> - Amount: ${_.get(
                e,
                "amount",
                ""
              )}`;
            }).join("\n")
      }`
    );
  }
  next();
});

bot.action("your_nft", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }
  console.log("aaaa", ctx);
  const paramValue = ctx.match[1];
  const wallet = paramValue || getCurrentCommandWallet(ctx);

  if (!wallet)
    return ctx.reply(
      "Please set your wallet with command /setwallet <mywallet>"
    );

  await replyNFT(wallet, ctx);
});

bot.action("top_listed_dogemap", async (ctx) => {
  const isPremium = await isUserTelegramPremiumCtx(ctx);
  if (!isPremium) {
    return ctx.reply("User is not whitelist, please contact admin");
  }
  const wallet = getCurrentCommandWallet(ctx);

  if (!wallet)
    return ctx.reply(
      "Please set your wallet with command /setwallet <mywallet>"
    );

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
    return ctx.reply("User is not whitelist, please contact admin");
  }
  const wallet = getCurrentCommandWallet(ctx);

  if (!wallet)
    return ctx.reply(
      "Please set your wallet with command /setwallet <mywallet>"
    );

  const data = await getTrending(wallet);
  ctx.replyWithHTML(
    `<b>📈 Top trending:</b>\n${_.map(data, (e) => {
      return `💠 <b>${e.tick}</b> - ${e.price} DOGE - 📈 24h: ${(
        e.change24h * 100
      ).toFixed(2)}%`;
    }).join("\n")}`
  );
});

try {
  bot.launch();
} catch (error) {}
