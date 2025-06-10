const { SlashCommandBuilder } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { withVerificationCheck } = require("../../utils/withVerificationCheck");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getid")
    .setDescription("View your username, Discord ID, and Interlink ID"),

  execute: withVerificationCheck(async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      const sheets = await getSheetsInstance();

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = res.data.values || [];
      const row = rows.find((r) => r[1] === username);

      if (row) {
        const customId = row[0] || "Not set";
        await interaction.editReply(
          `👤 **Username**: ${username}\n🆔 **Discord ID**: ${userId}\n💳 **Interlink ID**: ${customId}`
        );
      } else {
        await interaction.editReply(
          `👤 **Username**: ${username}\n🆔 **Discord ID**: ${userId}\n⚠️ **Interlink ID**: *Not assigned yet!*`
        );
      }
    } catch (err) {
      console.error("🔥 Error reading Google Sheet:", err);
      await interaction.editReply(
        "❌ Unable to fetch data from Google Sheets. Please check configuration."
      );
    }
  }),
};
