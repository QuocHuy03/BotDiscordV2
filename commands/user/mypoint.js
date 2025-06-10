const { SlashCommandBuilder } = require("discord.js");
const { getSheetData } = require("../../ggsheet");
const { withVerificationCheck } = require("../../utils/withVerificationCheck");

const spreadsheetId = process.env.SHEET_ID;
const sheetRange = `${process.env.SHEET_NAME}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mypoint")
    .setDescription("📊 View your ITLG points and ranking in the system"),

  execute: withVerificationCheck(async (interaction) => {

    await interaction.deferReply({ ephemeral: true });


    try {
      const username = interaction.user.username;
      const rows = await getSheetData(spreadsheetId, sheetRange);

      const validRows = rows
        .filter((r) => r[1] && r[2] && !isNaN(r[2]))
        .map((r) => ({ username: r[1], points: parseInt(r[2]) }));

      const userData = validRows.find((r) => r.username === username);

      if (!userData) {
        return await interaction.editReply(
          `❌ Could not find your data in the system.`
        );
      }

      const sorted = validRows.sort((a, b) => b.points - a.points);
      const rank = sorted.findIndex((r) => r.username === username) + 1;
      const total = sorted.length;

      await interaction.editReply(
        `👤 **Username:** ${username}\n` +
        `🏆 **Rank:** #${rank} out of ${total} users\n` +
        `🪙 **Points:** ${userData.points} ITLG`
      );
    } catch (err) {
      console.error("🔥 Error while processing /mypoint:", err);
      await interaction.editReply(
        "❌ Unable to fetch data from Google Sheets. Please contact the dev team."
      );
    }
  }),
};
