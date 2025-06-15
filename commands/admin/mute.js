const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const logSheet = process.env.SHEET_BANNED;

function getDurationInMs(unit, value) {
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (map[unit] || 0);
}

function formatTime(ms) {
  const secs = Math.floor(ms / 1000) % 60;
  const mins = Math.floor(ms / 60000) % 60;
  const hrs = Math.floor(ms / 3600000) % 24;
  const days = Math.floor(ms / 86400000);
  return [
    days ? `${days}d` : "",
    hrs ? `${hrs}h` : "",
    mins ? `${mins}m` : "",
    secs ? `${secs}s` : "",
  ].filter(Boolean).join(" ");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("🔇 Temporarily mute a user (timeout)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("target")
        .setDescription("User to mute")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("duration")
        .setDescription("Duration number (e.g., 10)")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("unit")
        .setDescription("Unit: seconds/minutes/hours/days")
        .setRequired(true)
        .addChoices(
          { name: "Seconds", value: "s" },
          { name: "Minutes", value: "m" },
          { name: "Hours", value: "h" },
          { name: "Days", value: "d" }
        ))
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for mute")
        .setRequired(false)),

  async execute(interaction) {
    await safeDefer(interaction);

    const member = interaction.options.getMember("target");
    const duration = interaction.options.getInteger("duration");
    const unit = interaction.options.getString("unit");
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!member) return await interaction.editReply("❌ User not found.");
    if (!member.moderatable) return await interaction.editReply("❌ Cannot mute this user.");
    if (duration <= 0) return await interaction.editReply("⚠️ Duration must be a positive number.");

    const ms = getDurationInMs(unit, duration);
    if (ms > 604800000) {
      return await interaction.editReply("⚠️ Duration cannot exceed 7 days (604800 seconds).");
    }

    const issuer = interaction.member;
    if (
      member.roles.highest.position >= issuer.roles.highest.position &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return await interaction.editReply("⚠️ You cannot mute a user with equal or higher role.");
    }

    try {
      await queue.add(async () => {
        await member.timeout(ms, reason);

        const formattedTime = formatTime(ms);

        await interaction.editReply(
          `🔇 **${member.user.tag}** has been muted for **${formattedTime}**.\n📝 Reason: ${reason}`
        );

        const sheets = await getSheetsInstance();
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${logSheet}!A2:F`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[
              new Date().toISOString(),
              interaction.user.tag,
              member.user.tag,
              member.user.id,
              formattedTime,
              reason
            ]]
          }
        });

        console.log(`📋 Logged mute: ${member.user.tag} (${member.user.id}) for ${formattedTime} – ${reason}`);
      });
    } catch (err) {
      console.error("🔥 Mute error:", err);
      await interaction.editReply("❌ Failed to mute user.");
    }
  },
};
