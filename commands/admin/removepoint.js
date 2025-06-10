const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removepoint")
    .setDescription("➖ Remove points from a user")
     .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option
        .setName("username")
        .setDescription("Select a user to remove points from")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of points to remove")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember("username");
    const amount = interaction.options.getInteger("amount");

    if (!member || !member.user?.username) {
      return await interaction.editReply("⚠️ Invalid user selected.");
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return await interaction.editReply("⚠️ Amount must be a positive integer.");
    }

    const username = member.user.username;

    try {
      const sheets = await getSheetsInstance();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const rows = res.data.values || [];

      const index = rows.findIndex(
        r => r[1]?.trim().toLowerCase() === username.toLowerCase()
      );

      if (index === -1) {
        return await interaction.editReply(`❌ User \`${username}\` not found in sheet.`);
      }

      const currentPoint = parseInt(rows[index][2]) || 0;
      const updatedPoint = Math.max(0, currentPoint - amount);
      const targetRow = index + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!C${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[updatedPoint]] },
      });

      await interaction.editReply(
        `✅ Removed ${amount} points from **${member.user.tag}** → Remaining: **${updatedPoint} ITLG**`
      );
    } catch (err) {
      console.error("🔥 Error while removing points:", err);
      await interaction.editReply("❌ Failed to update points. Please check Sheets connection.");
    }
  },
};
