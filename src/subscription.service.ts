import { Database } from "better-sqlite3";
import CronService, { CronModel, CronNames } from "./cron";
import { BotContext } from "./express";

export class SubscriptionsService {
  db: Database;
  cronService: CronService;
  constructor(db: Database, cronService: CronService) {
    this.db = db;
    this.cronService = cronService;
  }

  suscribeToCelpebras(userId: number) {
    this.cronService.addCronJob({
      name: CronNames.SubscribeCelpebras,
      scheduleMinutes: 15,
      user: userId,
    } as CronModel);

    return true;
  }

  getSubscriptionByUserId(userId: number) {
    const subscriptionCron = this.cronService.getCronJobById(userId);
    return subscriptionCron;
  }

  removeSubscriptionByUserId(userId: number) {
    this.cronService.deleteCronJobById(userId);
  }

  buildSubscriptionMessage(ctx: BotContext) {
    return ctx.sendMessage("A que quieres suscribirte?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Celpebras",
              callback_data: CronNames.SubscribeCelpebras,
            },
            // {
            //   text: "A memes",
            //   callback_data: "memes",
            // },
          ],
        ],
      },
    });
  }
}
