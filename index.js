const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        products TEXT,
        total INTEGER,
        sent INTEGER DEFAULT 0
      );
    `);
    console.log("Таблица orders готова ✅");
  } catch (err) {
    console.log("Ошибка создания таблицы:", err.message);
  }
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Glowrush bot запущен ✅");
});

async function checkOrders() {
  try {
    const result = await db.query(
      "SELECT * FROM orders WHERE sent = 0"
    );

    const orders = result.rows;

    for (const order of orders) {
      const text =
        "🛒 Новый заказ\n\n" +
        order.products +
        "\n💰 Итого: " + order.total + " сум";

      await bot.sendMessage(chatId, text);

      await db.query(
        "UPDATE orders SET sent = 1 WHERE id = $1",
        [order.id]
      );
    }

  } catch (error) {
    console.log("Ошибка:", error.message);
  }
}

async function start() {
  await initDB();
  setInterval(checkOrders, 5000);
}

start();
