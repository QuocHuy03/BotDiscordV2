const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addpoint")
    .setDescription("➕ Add points to a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("username")
        .setDescription("Select a user to add points to")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of points to add")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember("username");
    const amount = interaction.options.getInteger("amount");

    // 🧱 Validation
    if (!member || !member.user || !member.user.username) {
      return await interaction.editReply("⚠️ Invalid user selected.");
    }

    if (!Number.isInteger(amount) || amount === 0) {
      return await interaction.editReply(
        "⚠️ Amount must be a non-zero integer."
      );
    }

    const username = member.user.username;

    try {
      const sheets = await getSheetsInstance();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const rows = res.data.values || [];

      // 🔍 Tìm index dòng tương ứng
      const index = rows.findIndex(
        (r) => r[1]?.trim().toLowerCase() === username.toLowerCase()
      );

      if (index === -1) {
        return await interaction.editReply(
          `❌ User \`${username}\` not found in sheet.`
        );
      }

      const currentPoint = parseInt(rows[index][2]) || 0;
      const updatedPoint = currentPoint + amount;
      const targetRow = index + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!C${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[updatedPoint]] },
      });

      await interaction.editReply(
        `✅ Added ${amount} points to **${member.user.tag}** → Total: **${updatedPoint} ITLG**`
      );
    } catch (err) {
      console.error("🔥 Error while adding points:", err);
      await interaction.editReply("❌ Failed to update points.");
    }
  },
};
