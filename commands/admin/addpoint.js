const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addpoint")
    .setDescription("➕ Add or remove ITLG points for a user (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option
        .setName("username")
        .setDescription("Select a user to modify points")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of points to add (can be negative)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await safeDefer(interaction);
    await interaction.editReply("⏳ Processing point update...");

    await queue.add(async () => {
      try {
        const member = interaction.options.getMember("username");
        const amount = interaction.options.getInteger("amount");

        if (!member || !member.user) {
          return await interaction.followUp({
            content: "⚠️ Invalid user selected.",
            ephemeral: true,
          });
        }

        if (!Number.isInteger(amount) || amount === 0) {
          return await interaction.followUp({
            content: "⚠️ Amount must be a non-zero integer.",
            ephemeral: true,
          });
        }

        const username = member.user.username;
        const sheets = await getSheetsInstance();
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = res.data.values || [];

        const index = rows.findIndex(
          (r) => r[1]?.trim().toLowerCase() === username.toLowerCase()
        );

        if (index === -1) {
          return await interaction.followUp({
            content: `❌ User \`${username}\` not found in sheet.`,
            ephemeral: true,
          });
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

        await interaction.followUp({
          content: `✅ **${amount}** points ${
            amount > 0 ? "added to" : "removed from"
          } **${member.user.tag}**\n📊 New total: **${updatedPoint} ITLG** <:itlgcoin:1329529870916517940>`,
          ephemeral: true,
        });

        console.log(
          `📈 [ADDPOINT] ${interaction.user.tag} ${amount > 0 ? "added" : "removed"} ${Math.abs(amount)} ITLG to ${member.user.tag} → ${updatedPoint} total`
        );
      } catch (err) {
        console.error("🔥 Error in /addpoint:", err);
        await interaction.followUp({
          content: "❌ Failed to update points due to a system error.",
          ephemeral: true,
        });
      }
    });
  },
};
