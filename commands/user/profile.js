const { SlashCommandBuilder } = require("discord.js");
const { getSheetData } = require("../../ggsheet");
const { withVerificationCheck } = require("../../utils/withVerificationCheck");

const spreadsheetId = process.env.SHEET_ID;
const sheetRange = `${process.env.SHEET_NAME}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your official ITLG score from Interlink"),

  execute: withVerificationCheck(async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const username = interaction.user.username;
    const rows = await getSheetData(spreadsheetId, sheetRange);
    console.log(rows)
    const row = rows.find((r) => r[1] === username);

    if (row) {
      await interaction.editReply(`👤 **${username}** currently has **${row[2] || 0} ITLG** 🏆`);
    } else {
      await interaction.editReply(`❌ No ITLG record found for **${username}**.`);
    }
  }),
};
