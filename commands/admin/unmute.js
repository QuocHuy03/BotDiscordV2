const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");

const spreadsheetId = process.env.SHEET_ID;
const logSheet = process.env.SHEET_BANNED;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("🔈 Unmute a user manually")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("User to unmute")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unmute")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!member) {
      return await interaction.editReply("❌ User not found.");
    }

    if (!member.moderatable) {
      return await interaction.editReply(
        "❌ I don't have permission to unmute this user."
      );
    }

    if (
      !member.communicationDisabledUntil ||
      member.communicationDisabledUntilTimestamp < Date.now()
    ) {
      return await interaction.editReply(
        `ℹ️ **${member.user.tag}** is not muted or already unmuted.`
      );
    }

    try {
      await member.timeout(null, reason); // Gỡ timeout bằng cách đặt lại timeout = null

      await interaction.editReply(
        `✅ **${member.user.tag}** has been unmuted.\n📝 Reason: ${reason}`
      );

      // ✅ Ghi log unmute vào Google Sheet
      const sheets = await getSheetsInstance();
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${logSheet}!A2:E`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              new Date().toISOString(),
              interaction.user.tag,
              member.user.tag,
              "UNMUTE",
              reason,
            ],
          ],
        },
      });
    } catch (err) {
      console.error("🔥 Unmute Error:", err);
      await interaction.editReply("❌ Failed to unmute user.");
    }
  },
};
