import { Database } from "better-sqlite3";

import cron from "node-cron";
import { BotContext } from "./express";
import { Telegraf } from "telegraf";
import { CronCommands } from "./cron.commands";

export type ActiveCronJobsModel = {
  id: number;
  cron: cron.ScheduledTask;
};

class CronService {
  private database: Database;
  private activeCronJobs: ActiveCronJobsModel[];
  private bot: Telegraf<BotContext>;

  constructor(database: Database, bot: Telegraf<BotContext>) {
    this.database = database;
    this.activeCronJobs = [];
    this.bot = bot;

    this.init();
  }

  public getCronJobs(): CronModel[] {
    const results = this.database.prepare("SELECT * FROM cron_jobs").all();
    const cronJobs: CronModel[] = results.map((row: any) => {
      return {
        id: row.id,
        name: row.name,
        scheduleMinutes: row.scheduleMinutes,
        user: row.user,
      } as CronModel;
    });

    return cronJobs;
  }

  public getCronJobById(id: number): CronModel | undefined {
    const result = this.database
      .prepare("SELECT * FROM cron_jobs WHERE id = ?")
      .get(id);
    if (result) {
      return {
        id: (result as any).id,
        name: (result as any).name,
        scheduleMinutes: (result as any).scheduleMinutes,
        user: (result as any).user,
      } as CronModel;
    }
  }

  public init(): void {
    // Register all cron jobs on the database
    const cronJobs = this.getCronJobs();

    cronJobs.forEach((cronJob: CronModel) => {
      const minutesStringForCron = `*/${cronJob.scheduleMinutes} * * * *`;
      // Register the cron job with the cron library
      const newCron = cron.schedule(minutesStringForCron, () => {
        this.handleCronJob(cronJob);
      });
      newCron.start();
      this.activeCronJobs.push({
        id: cronJob.id,
        cron: newCron,
      });
    });
  }

  handleCronJob(cron: CronModel): void {
    console.log(`Cron job ${cron.name} triggered to user ${cron.user}`);
    // Handle cron job logic when triggered
    switch (cron.name) {
      case CronNames.SubscribeCelpebras:
        CronCommands.celpebras(this.bot, cron);
        break;
      case "example":
        console.log("Example cron job triggered");
        break;
      default:
        console.error("Cron with unknown name triggered");
        break;
    }
  }

  public addCronJob(newCron: CronModel): void {
    // Add a new cron job to the database
    const minutesStringForCron = `*/${newCron.scheduleMinutes} * * * *`;
    // Register the cron job with the cron library
    const cronJob = cron.schedule(minutesStringForCron, () => {
      this.handleCronJob(newCron);
    });
    cronJob.start();
    this.activeCronJobs.push({
      id: newCron.id,
      cron: cronJob,
    });
    this.database
      .prepare(
        "INSERT INTO cron_jobs (name, scheduleMinutes, user) VALUES (?, ?, ?)"
      )
      .run(newCron.name, newCron.scheduleMinutes, newCron.user);
  }

  public stopCronJobById(id: number): void {
    // Cancel a specific cron job by id and remove it from the database
    const cronJob = this.activeCronJobs.find((cronJob) => cronJob.id === id);
    if (cronJob) {
      cronJob.cron.stop();
      this.activeCronJobs = this.activeCronJobs.filter(
        (cronJob) => cronJob.id !== id
      );
    }
  }

  stopAllCronJobs(): void {
    // Stop all cron jobs
    this.activeCronJobs.forEach((cronJob) => {
      cronJob.cron.stop();
    });
  }

  deleteCronJobById(id: number): void {
    // Delete a cron job from the database
    this.stopCronJobById(id);
    const cronJob = this.activeCronJobs.splice(
      this.activeCronJobs.findIndex((cronJob) => cronJob.id === id),
      1
    )[0];
    this.database.prepare("DELETE FROM cron_jobs WHERE id = ?").run(id);
  }

  deleteAllCronJobs(): void {
    // Delete all cron jobs from the database
    this.stopAllCronJobs();
    this.activeCronJobs = [];
    this.database.prepare("DELETE FROM cron_jobs").run();
  }
}

export default CronService;

export enum CronNames {
  SubscribeCelpebras = "subscribe.celpebras",
  Example = "example",
}

export type CronModel = {
  id: number;
  name: CronNames;
  scheduleMinutes: number;
  user: number;
};
