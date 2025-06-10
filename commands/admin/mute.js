const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const spreadsheetId = process.env.SHEET_ID;
const logSheet = process.env.SHEET_BANNED;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("🔇 Timeout a user (temporarily disable chatting/speaking)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName("target")
        .setDescription("User to mute")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("duration")
        .setDescription("Duration number")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("unit")
        .setDescription("Unit: s (seconds), m (minutes), h (hours), d (days)")
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
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.options.getMember("target");
    const duration = interaction.options.getInteger("duration");
    const unit = interaction.options.getString("unit");
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!member) {
      return await interaction.editReply("❌ User not found.");
    }

    if (!member.moderatable) {
      return await interaction.editReply("❌ I don't have permission to mute this user.");
    }

    // 🧮 Chuyển đổi đơn vị sang ms
    const multiplier = { s: 1000, m: 60_000, h: 3600_000, d: 86400_000 };
    const ms = duration * (multiplier[unit] || 60_000);

    if (ms > 604800000) { // max 7 days
      return await interaction.editReply("⚠️ Duration cannot exceed 7 days.");
    }

    try {
      await member.timeout(ms, reason);
      await interaction.editReply(`✅ **${member.user.tag}** has been muted for **${duration}${unit}**.\n📝 Reason: ${reason}`);

      // ✅ Ghi log vào Google Sheets
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
            `${duration}${unit}`,
            reason
          ]]
        }
      });
    } catch (err) {
      console.error("🔥 Mute Error:", err);
      await interaction.editReply("❌ Failed to mute user.");
    }
  }
};
