import { plainToInstance } from "class-transformer";
import { SessionState } from "./bot.controller";

export class SessionData {
  user_id?: number;
  chat_id: number;
  message_id?: number | null;
  command?: string | null;
  state: SessionState;

  constructor(
    user_id?: number,
    chat_id: number = 0,
    message_id?: number,
    command?: string,
    state: SessionState = SessionState.idle
  ) {
    this.user_id = user_id;
    this.chat_id = chat_id;
    this.message_id = message_id;
    this.command = command;
    this.state = state;
  }

  static fromJSON(json?: string | unknown): SessionData {
    const aylmao = plainToInstance(SessionData, json);
    return aylmao ?? new SessionData();
  }

  getOriginalCommand(messageId?: number) {
    if (messageId) {
      if (this.message_id === messageId) {
        return this.command;
      }
    }
    return null;
  }

  copyWith(modifyObject: {
    [P in keyof SessionData]?: SessionData[P];
  }): SessionData {
    return Object.assign(Object.create(SessionData.prototype), {
      ...this,
      ...modifyObject,
    });
  }
}
