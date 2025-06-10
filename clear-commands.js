// clear-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🧹 Xoá global commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log("✅ Đã xoá global!");

    if (process.env.GUILD_ID) {
      console.log("🧹 Xoá guild commands...");
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
      console.log("✅ Đã xoá guild!");
    }
  } catch (error) {
    console.error("❌ Lỗi khi xoá:", error);
  }
})();
