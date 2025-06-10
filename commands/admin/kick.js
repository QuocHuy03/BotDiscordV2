const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("👢 Kick a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName("target").setDescription("User to kick").setRequired(true))
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for kick").setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember("target");
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!member) return await interaction.reply("❌ User not found.");
    if (!member.kickable) return await interaction.reply("❌ Cannot kick this user.");

    try {
      await member.kick(reason);
      await interaction.reply(`👢 **${member.user.tag}** has been kicked. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.reply("❌ Failed to kick user.");
    }
  }
};
