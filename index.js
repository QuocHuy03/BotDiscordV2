require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { handleAntiSpam } = require("./utils/antiSpam");
const { autoNotiTrusteds } = require("./jobs/autoNotiTrusted");
const { CronJob } = require("cron");
const { cacheAllMembers } = require("./utils/memberCache");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
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

// ✅ Anti-spam handler
client.on("messageCreate", async (message) => {
  await handleAntiSpam(message);
});

// ✅ Bot ready
client.once("ready", async () => {
  console.log(`✅ Bot đang dùng tên: ${client.user.username}`);
  console.log(`🖼️ Avatar URL: ${client.user.displayAvatarURL()}`);
  console.log(`✅ Bot đã online với tên: ${client.user.tag}`);

  const job = new CronJob("*/60 * * * * *", async () => {
    console.log("🔄 Running auto task (every 60s)...");
    await autoNotiTrusteds(client);
  });
  job.start();
});

client.once("ready", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await cacheAllMembers(guild);
  console.log(`🚀 Bot đã sẵn sàng và member đã cache`);
});
// ✅ Command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn("⚠️ Command not found:", interaction.commandName);
    return;
  }

  console.log("🧠 Running command:", interaction.commandName);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("❌ Command error:", error);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "❌ Something went wrong during command execution.",
        });
      } else {
        await interaction.reply({
          content: "❌ Something went wrong!",
          flags: 1 << 6, // ephemeral
        });
      }
    } catch (innerError) {
      console.error("🔥 Failed to send error response:", innerError);
    }
  }
});

// ✅ BẮT lỗi toàn cục để bot không chết
process.on("unhandledRejection", (reason, p) => {
  console.error("💥 Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});

client.login(process.env.TOKEN);
