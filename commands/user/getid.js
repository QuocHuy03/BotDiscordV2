const { SlashCommandBuilder } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getid")
    .setDescription("View your username, Discord ID, and Interlink ID"),

  async execute(interaction) {
    await safeDefer(interaction);
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.editReply("⏳ Fetching your information... Please wait.");

    await queue.add(async () => {
      try {
        const sheets = await getSheetsInstance();
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

        const rows = res.data.values || [];
        const row = rows.find((r) => r[1] === username);
        const customId = row ? row[0] || "*Not set*" : "*Not assigned yet!*";

        await interaction.followUp({
          content:
            `👤 **Username**: ${username}\n🆔 **Discord ID**: ${userId}\n💳 **Interlink ID**: ${customId}`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("🔥 Error reading Google Sheet:", err);
        await interaction.followUp({
          content:
            "❌ Unable to fetch data from Google Sheets. Please check configuration.",
          ephemeral: true,
        });
      }
    });
  },
};
