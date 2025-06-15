const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const { queue } = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const logSheet = process.env.SHEET_BANNED;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("🔈 Unmute a user manually")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("target")
        .setDescription("User to unmute")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for unmute")
        .setRequired(false)
    ),

  async execute(interaction) {
    await safeDefer(interaction);

    const member = interaction.options.getMember("target");
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!member) {
      return interaction.editReply("❌ User not found in the server.");
    }

    if (!member.moderatable) {
      return interaction.editReply("❌ I don't have permission to unmute this user.");
    }

    const timeoutUntil = member.communicationDisabledUntilTimestamp;
    if (!timeoutUntil || timeoutUntil < Date.now()) {
      return interaction.editReply(`ℹ️ **${member.user.tag}** is not currently muted.`);
    }

    return queue.add(async () => {
      try {
        await member.timeout(null, reason);

        await interaction.editReply(
          `✅ **${member.user.tag}** has been unmuted.\n📝 Reason: ${reason}`
        );

        const sheets = await getSheetsInstance();
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${logSheet}!A2:E`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[
              new Date().toISOString(),
              interaction.user.tag,
              member.user.tag,
              "UNMUTE",
              reason
            ]]
          }
        });

      } catch (err) {
        console.error("🔥 Unmute Error:", err);
        await interaction.editReply("❌ Failed to unmute user. Check bot permissions or connection.");
      }
    });
  }
};
