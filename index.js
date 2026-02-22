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

setInterval(checkOrders, 5000);
