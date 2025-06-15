const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const { queue } = require("../../utils/queue");

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
        .setDescription("New point value (must be ≥ 0)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await safeDefer(interaction);

    const member = interaction.options.getMember("username");
    const point = interaction.options.getInteger("point");

    if (!member || !member.user?.username) {
      return interaction.editReply("⚠️ Invalid user selected.");
    }

    if (point < 0) {
      return interaction.editReply("⚠️ Point must be a non-negative integer.");
    }

    const username = member.user.username;

    return queue.add(async () => {
      try {
        const sheets = await getSheetsInstance();
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = res.data.values || [];

        const index = rows.findIndex(
          r => r[1]?.trim().toLowerCase() === username.toLowerCase()
        );

        if (index === -1) {
          return interaction.editReply(`❌ User \`${username}\` not found in sheet.`);
        }

        const targetRange = `${sheetName}!C${index + 2}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: targetRange,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[point]] },
        });

        await interaction.editReply(
          `✅ Updated **${member.user.tag}**'s points to **${point} ITLG** <:itlgcoin:1329529870916517940>`
        );
      } catch (err) {
        console.error("🔥 Error while setting point:", err);
        await interaction.editReply("❌ Failed to update points. Please try again or check Google Sheet connection.");
      }
    });
  },
};
