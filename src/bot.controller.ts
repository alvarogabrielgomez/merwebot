import { Database } from "better-sqlite3";
import { BotContext } from "./express";
import { SessionData } from "./pending-commands";
import CronService, { CronModel, CronNames } from "./cron";
import { SubscriptionsService } from "./subscription.service";

export class BotController {
  db: Database;
  subService: SubscriptionsService;
  constructor(db: Database, subscriptionsService: SubscriptionsService) {
    this.db = db;
    this.subService = subscriptionsService;
  }

  async ping(ctx: BotContext) {
    const chat_id = ctx.message?.chat.id;
    if (chat_id) {
      ctx.telegram.sendMessage(chat_id, "Pong!");
    }
  }

  async subscribe(ctx: BotContext) {
    const chat_id = ctx.message?.chat.id;
    if (chat_id) {
      const question = await this.subService.buildSubscriptionMessage(ctx);
      const sessionData = SessionData.fromJSON(ctx.session);
      ctx.session = sessionData.copyWith({
        chat_id,
        message_id: question.message_id,
        command: "sub",
        state: SessionState.WaitingSubscribeCallback,
      });
    }
  }

  async subscribeCallback(ctx: BotContext, sessionData: SessionData) {
    const chat_id = ctx.callbackQuery?.message?.chat.id;
    const message_id = ctx.callbackQuery?.message?.message_id;
    const callbackData = (ctx.callbackQuery as any | unknown)?.data;
    if (!verifyIfDataIsOnEnum(callbackData, CronNames)) {
      console.error("Invalid callback data", callbackData);
      return ctx.telegram.editMessageText(
        chat_id,
        message_id,
        undefined,
        `No se ha podido suscribir a ${callbackData}`
      );
    }
    // Get from the session what callback query is waiting for
    ctx.session = sessionData.copyWith({
      chat_id,
      message_id: null,
      command: null,
      state: SessionState.idle,
    });

    if (chat_id) {
      switch (callbackData as CronNames) {
        case CronNames.SubscribeCelpebras:
          if (this.subService.suscribeToCelpebras(chat_id)) {
            ctx.telegram.editMessageText(
              chat_id,
              message_id,
              undefined,
              `Te has suscrito a Celpebras!`
            );
            return ctx.telegram.sendMessage(
              chat_id,
              "En el momento que las inscripciones esten abiertas te avisaré!"
            );
          } else {
            return this.sendDefaultMessage(
              ctx,
              DefaultMessageType.subscribeError
            );
          }
        default:
          console.error("Invalid callback data", callbackData);
          return this.sendDefaultMessage(
            ctx,
            DefaultMessageType.subscribeError
          );
      }
    }
  }

  async sendDefaultMessage(ctx: BotContext, type: DefaultMessageType) {
    console.error("Error", type);
    switch (type) {
      case DefaultMessageType.error:
        return ctx.reply("Ha ocurrido un error");
      case DefaultMessageType.subscribeError:
        return ctx.reply("No se ha podido suscribir");
    }
  }
}

export enum SessionState {
  idle = "idle",
  WaitingSubscribeCallback = "waiting.subscribe.callback",
}

enum DefaultMessageType {
  subscribe = "subscribe",
  subscribeError = "subscribe.error",
  unsubscribe = "unsubscribe",
  unsubscribeError = "unsubscribe.error",
  error = "error",
}

function verifyIfDataIsOnEnum(data: any, enumType: any) {
  return Object.values(enumType).includes(data);
}
