import { Telegraf, Context, session, Composer } from "telegraf";
import { SQLite } from "@telegraf/session/sqlite";
import dotenv from "dotenv";

const store = SQLite<SessionData>({
  filename: "./telegraf-sessions.sqlite",
});

dotenv.config();

console.log("Iniciando bot...");

interface SessionData {
  userIds: number[];
}

interface BotContext extends Context {
  session?: SessionData;
}

// Crear una nueva instancia de Telegraf con el token de bot
const bot = new Telegraf<BotContext>(process.env.API_KEY as string);
const composer = new Composer<BotContext>();
bot.use(composer);

// // Register session middleware
bot.use(session({ store }));

bot.start((ctx: BotContext) => {
  ctx.reply("Return to monke!");
  // get user id
  const userId = ctx.message?.from.id;
  const chatId = ctx.message?.chat.id;
  // check if the user is already in the session

  if (userId && !ctx.session?.userIds.includes(userId)) {
    ctx.session?.userIds.push(userId);
  }

  ctx.setChatMenuButton({
    type: "web_app",
    text: "Aylmao",
    web_app: {
      url: "https://www.google.com",
    },
  });

  console.log(`User ${userId} started the bot`);
});

async function ping(ctx: BotContext) {
  // send a request to the API /gpt
  const chat_id = ctx.message?.chat.id;
  if (chat_id) {
    // reply to user
    ctx.telegram.sendMessage(chat_id, "Pong!");
    ctx
      .sendInvoice({
        title: "Test",
        description: "Test",
        payload: "test",
        provider_token: process.env.PAYMENT_TOKEN as string,
        currency: "USD",
        prices: [{ label: "Test", amount: 100 }],
        start_parameter: "test",
      })
      .then((res) => {
        ctx.telegram.sendMessage(chat_id, "Pagao!");
      });
  }
}

// async function gptGenerate(prompt: string) {
//   // send a request to the API /gpt
//   try {
//     const response = await axios.post("http://127.0.0.1:5001/gpt", {
//       prompt: prompt,
//     });
//     return response.data;
//   } catch (error) {
//     console.log(error);
//     return "Error";
//   }
// }

// // Definir una función para procesar comando /gpt
// async function handleGPTCommand(ctx: Context) {
//   // Obtener el ID del remitente del mensaje
//   const chatId = ctx.message?.chat.id;
//   if (chatId) {
//     const message = (ctx.message as any)["text"];
//     const prompt = message.substring(message.indexOf(" ") + 1);
//     // Enviar un mensaje de respuesta al remitente
//     ctx.reply("Generando texto...").then(async (sentMessage) => {
//       const messageId = sentMessage.message_id;
//       const generatedText = await gptGenerate(prompt);
//       let editedMessage = generatedText?.message ?? "";
//       // Obtener el mensage generado por gpt
//       if (editedMessage == "") {
//         editedMessage = "No se pudo generar el texto";
//       }
//       ctx.telegram.editMessageText(
//         ctx.chat?.id,
//         messageId,
//         undefined,
//         editedMessage
//       );
//     });

//     // Registrar el mensaje en la consola
//     console.log(`Mensaje recibido de ${chatId}`);
//   }
// }

bot.command("ping", ping);

// Export the bot instance
export default bot;
