const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removepoint")
    .setDescription("➖ Remove points from a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option.setName("username")
        .setDescription("Select a user to remove points from")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Number of points to remove")
        .setRequired(true)),

  async execute(interaction) {
    await safeDefer(interaction);

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
      await queue.add(async () => {
        const sheets = await getSheetsInstance();
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = res.data.values || [];

        const index = rows.findIndex(r => r[1]?.trim().toLowerCase() === username.toLowerCase());

        if (index === -1) {
          return await interaction.editReply(`❌ User \`${username}\` not found in sheet.`);
        }

        const currentPoint = parseInt(rows[index][2]) || 0;
        const updatedPoint = Math.max(0, currentPoint - amount);
        const actualRemoved = currentPoint - updatedPoint;
        const targetRow = index + 2;

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!C${targetRow}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[updatedPoint]] },
        });

        const msg = actualRemoved < amount
          ? `⚠️ Only **${actualRemoved}** points were removed because the user had less than that.\n`
          : "";

        await interaction.editReply(
          `${msg}✅ Removed **${actualRemoved}** points from **${member.user.tag}** → Remaining: **${updatedPoint} ITLG** <:itlgcoin:1329529870916517940>`
        );
      });
    } catch (err) {
      console.error("🔥 Error while removing points:", err);
      await interaction.editReply("❌ Failed to update points. Please check Sheets connection or bot permissions.");
    }
  },
};
