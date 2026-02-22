const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2');

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
  queueLimit: 0
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Glowrush bot запущен ✅");
});

setInterval(() => {

  db.query("SELECT * FROM orders WHERE sent = 0", (err, results) => {

    if (err) {
      console.log("Ошибка БД:", err);
      return;
    }

    results.forEach(order => {

      const text =
        "🛒 Новый заказ\n\n" +
        order.products +
        "\n💰 Итого: " + order.total + " сум";

      bot.sendMessage(chatId, text);

      db.query("UPDATE orders SET sent = 1 WHERE id = ?", [order.id]);

    });

  });

}, 5000);
