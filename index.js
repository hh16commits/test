const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2');

// Проверка переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не задан");
  process.exit(1);
}

if (!process.env.CHAT_ID) {
  console.error("❌ CHAT_ID не задан");
  process.exit(1);
}

// Telegram
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("❌ Ошибка подключения к БД:", err);
    return;
  }
  console.log("✅ Подключение к БД успешно");
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Glowrush bot запущен ✅");
});

// Проверка новых заказов
setInterval(() => {

  db.query("SELECT * FROM orders WHERE sent = 0", (err, results) => {

    if (err) {
      console.error("Ошибка запроса:", err);
      return;
    }

    if (results.length === 0) return;

    results.forEach(order => {

      const text =
        "🛒 Новый заказ Glowrush\n\n" +
        order.products +
        "\n\n💰 Итого: " + order.total + " сум";

      bot.sendMessage(process.env.CHAT_ID, text)
        .then(() => {
          db.query("UPDATE orders SET sent = 1 WHERE id = ?", [order.id]);
        })
        .catch(err => console.error("Ошибка отправки:", err));

    });

  });

}, 5000);
