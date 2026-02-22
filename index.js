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

async function testDB() {
  try {
    const [rows] = await db.query("SELECT * FROM orders");
    console.log("БД подключена ✅");
    console.log(rows);
  } catch (err) {
    console.log("Ошибка БД ❌:", err.message);
  }
}

testDB();
setInterval(checkOrders, 5000);
