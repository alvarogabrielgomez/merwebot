import express from "express";
import DatabaseConstructor, { Database } from "better-sqlite3";

// import bot from "./bot";
import dotenv from "dotenv";
import { Context, session, Telegraf } from "telegraf";
import { SQLite } from "@telegraf/session/sqlite";
import { BotController, SessionState } from "./bot.controller";
import { SessionData } from "./pending-commands";
import CronService from "./cron";
import { SubscriptionsService } from "./subscription.service";

const db = new DatabaseConstructor("telegraf-sessions.sqlite", {
  verbose: console.log,
});

dotenv.config();

const store = SQLite<SessionData>({
  database: db,
});

// Create the table for crons if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS cron_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scheduleMinutes INTEGER NOT NULL, 
  user INTEGER NOT NULL
)`);

export interface BotContext extends Context {
  session?: SessionData;
}

const bot = new Telegraf<BotContext>(process.env.API_KEY as string);
bot.use(session({ store }));

bot.start((ctx: BotContext) => {
  ctx.reply("Return to monke!");
  // get user id
  const userId = ctx.message?.from.id;
  const username = ctx.message?.from.username;
  const sessionData = SessionData.fromJSON(ctx.session);
  ctx.session = sessionData.copyWith({ user_id: userId });

  console.log(`User ${userId}, ${username} started the bot`);
});

const botController = new BotController(
  db,
  new SubscriptionsService(db, new CronService(db, bot))
);

bot.command("ping", (ctx) => botController.ping(ctx));
bot.command("sub", (ctx) => botController.subscribe(ctx));
bot.on("callback_query", (ctx) => {
  const chat_id = ctx.callbackQuery?.message?.chat.id;
  const sessionData = SessionData.fromJSON(ctx.session);
  if (chat_id) {
    switch (sessionData.state) {
      case SessionState.WaitingSubscribeCallback:
        return botController.subscribeCallback(ctx, sessionData);
      default:
        ctx.telegram.sendMessage(
          chat_id,
          "Error al intentar procesar el callback"
        );
        break;
    }
  }

  ctx.answerCbQuery();
});

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.locals.bot = bot;
  next();
});

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/status", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  bot.launch();
});
