const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setpoint")
    .setDescription("🎯 Set specific point value for a user")
     .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option
        .setName("username")
        .setDescription("Select a user to set points to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("point")
        .setDescription("New point value")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember("username");
    const point = interaction.options.getInteger("point");

    if (!member || !member.user?.username) {
      return await interaction.editReply("⚠️ Invalid user selected.");
    }

    if (!Number.isInteger(point)) {
      return await interaction.editReply("⚠️ Point must be an integer.");
    }

    if (point < 0) {
      return await interaction.editReply("⚠️ Point cannot be negative.");
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

      const targetRow = index + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!C${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[point]] },
      });

      await interaction.editReply(
        `✅ Set **${member.user.tag}**'s points to **${point} ITLG**`
      );
    } catch (err) {
      console.error("🔥 Error while setting point:", err);
      await interaction.editReply(
        "❌ Failed to update points. Please check Sheets connection."
      );
    }
  },
};
