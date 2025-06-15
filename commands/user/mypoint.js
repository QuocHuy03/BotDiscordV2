const { SlashCommandBuilder } = require("discord.js");
const { getSheetData } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetRange = `${process.env.SHEET_NAME}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mypoint")
    .setDescription("📊 View your ITLG points and ranking in the system"),

  async execute(interaction) {
    await safeDefer(interaction);

    const username = interaction.user.username;

    await interaction.editReply("⏳ Retrieving your ITLG points and ranking...");

    await queue.add(async () => {
      try {
        const rows = await getSheetData(spreadsheetId, sheetRange);

        const validRows = rows
          .filter((r) => r[1] && r[2] && !isNaN(r[2]))
          .map((r) => ({ username: r[1], points: parseInt(r[2]) }));

        const userData = validRows.find((r) => r.username === username);

        if (!userData) {
          return await interaction.followUp({
            content: `❌ Could not find your data in the system.`,
            ephemeral: true,
          });
        }

        const sorted = validRows.sort((a, b) => b.points - a.points);
        const rank = sorted.findIndex((r) => r.username === username) + 1;
        const total = sorted.length;

        await interaction.followUp({
          content:
            `👤 **Username:** ${username}\n` +
            `🏆 **Rank:** #${rank} out of ${total} users\n` +
            `🪙 **Points:** ${userData.points} ITLG <:itlgcoin:1329529870916517940>`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("🔥 Error while processing /mypoint:", err);
        await interaction.followUp({
          content: "❌ Unable to fetch data from Google Sheets. Please try again later.",
          ephemeral: true,
        });
      }
    });
  },
};
