import { Telegraf } from "telegraf";
import CronService, { CronModel } from "./cron";
import { BotContext } from "./express";

export class CronCommands {
  static celpebras(bot: Telegraf<BotContext>, cron: CronModel) {
    const myHeaders = new Headers();
    myHeaders.append(
      "Cookie",
      "13923ae368f6105aa77518a75ddf7dd1=e5e82a064004e2a801c8b086503d0e6f; dtCookie=v_4_srv_9_sn_84E0953B518CC2031C7A5AF7A7A9911E_perc_100000_ol_0_mul_1_app-3Ad5d34fa90362050a_1; TS0178d8a8=01ae2560afb357f9daea5380249d35379f9a87d6286caf2c51b1af1fd8a7ae1670fb55a893128801e4757f87f885669f4349036ec8937e75c5a3c4d6271bb59175c27354c1; 13923ae368f6105aa77518a75ddf7dd1=9682bdc918841840b55103e611763065; TS0178d8a8=01ae2560afa5257965b00682e9fc97d64b2c70c95a8a82160fde1ead11fe3267498d963f2613f0ac48db5696f3d38c293dddf3e0d127fca43c01039cc9ec4e50f884746395"
    );
    myHeaders.append(
      "Referer",
      "http://celpebras.inep.gov.br/celpebras/preCadastro"
    );

    myHeaders.append("Origin", "http://celpebras.inep.gov.br");
    myHeaders.append("Host", "celpebras.inep.gov.br");
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      co_evento: 1,
      co_projeto: "2412001",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    } as RequestInit;

    fetch(
      "http://celpebras.inep.gov.br/celpebras/rest/autorization-evento",
      requestOptions
    ).then((response) => {
      if (response.status !== 412) {
        bot.telegram.sendMessage(
          cron.user,
          `La pagina del Celpebras ha cambiado. Revisa si las inscripciones estan abiertas.`
        );

        return bot.telegram.sendMessage(
          cron.user,
          `http://celpebras.inep.gov.br/celpebras/`
        );
      }
    });
  }
}
