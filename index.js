const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2/promise');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Glowrush bot запущен ✅");
});

async function checkOrders() {
  try {

    const [orders] = await db.query(
      "SELECT * FROM orders WHERE sent = 0"
    );

    for (const order of orders) {

      const text =
        "🛒 Новый заказ\n\n" +
        order.products +
        "\n💰 Итого: " + order.total + " сум";

      await bot.sendMessage(chatId, text);

      await db.query(
        "UPDATE orders SET sent = 1 WHERE id = ?",
        [order.id]
      );
    }

  } catch (error) {
    console.log("Ошибка:", error.message);
  }
}

setInterval(checkOrders, 5000);
