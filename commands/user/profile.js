const { SlashCommandBuilder } = require("discord.js");
const { getSheetData } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetRange = `${process.env.SHEET_NAME}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your official ITLG score from Interlink"),

  async execute(interaction) {
    await safeDefer(interaction);
    const username = interaction.user.username;

    await interaction.editReply("⏳ Fetching your official ITLG profile...");

    await queue.add(async () => {
      try {
        const rows = await getSheetData(spreadsheetId, sheetRange);
        const row = rows.find((r) => r[1] === username);

        if (row) {
          await interaction.followUp({
            content: `👤 **${username}** currently has **${row[2] || 0} ITLG** <:itlgcoin:1329529870916517940>`,
            ephemeral: true,
          });
        } else {
          await interaction.followUp({
            content: `❌ No ITLG record found for **${username}**.`,
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error("❌ Error executing /profile:", error);
        await interaction.followUp({
          content: "❌ An error occurred while processing your request. Please try again later.",
          ephemeral: true,
        });
      }
    });
  },
};
