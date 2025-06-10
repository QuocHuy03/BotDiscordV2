require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { handleAntiSpam } = require("./utils/antiSpam");
const { autoNotiTrusteds } = require("./jobs/autoNotiTrusted");
const { CronJob } = require("cron");

// Khởi tạo client với intent cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, // ✅ để nhận tin nhắn
    GatewayIntentBits.MessageContent, // ✅ để đọc nội dung tin nhắn
  ],
});

// Load lệnh từ thư mục ./commands
client.commands = new Collection();

// Đọc toàn bộ subfolder trong ./commands
const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const commandPath = path.join(__dirname, "commands", folder, file);
    const command = require(commandPath);

    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${folder}/${file}`);
    } else {
      console.warn(`⚠️ Skipped invalid command file: ${folder}/${file}`);
    }
  }
}

client.on("messageCreate", async (message) => {
  await handleAntiSpam(message);
});

// Log khi bot sẵn sàng
client.once("ready", async () => {
  // const imagePath = path.join(__dirname, "avatar.jpg"); // Đường dẫn đến ảnh avatar
  // const avatar = fs.readFileSync(imagePath);
  // await client.user.setAvatar(avatar);
  // await client.user.setUsername("AxoPoint");
  // console.log("✅ Bot name updated!");
  console.log(`✅ Bot đang dùng tên: ${client.user.username}`);
  console.log(`🖼️ Avatar URL: ${client.user.displayAvatarURL()}`);
  console.log(`✅ Bot đã online với tên: ${client.user.tag}`);

  // Cron chạy mỗi 2 phút
  const job = new CronJob("*/10 * * * * *", async () => {
    console.log("🔄 Running auto task (every 10s)...");
    await autoNotiTrusteds(client);
  });
  job.start();
});

// 🧠 Lắng nghe 1 lần duy nhất interactionCreate
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log("⚠️ Command not found:", interaction.commandName);
    return;
  }
  console.log("🧠 Running command:", interaction.commandName);
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("❌ Command error:", error);

    // Tránh lỗi reply 2 lần
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Something went wrong!",
        ephemeral: true,
      });
    }
  }
});

// Đăng nhập bot
client.login(process.env.TOKEN);
