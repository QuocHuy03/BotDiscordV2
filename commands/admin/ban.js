const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("🔨 Permanently ban a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("target").setDescription("User to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for ban")
        .setRequired(false)
    ),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!user) {
      return await interaction.editReply("❌ Cannot find the specified user.");
    }

    try {
      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return await interaction.editReply(
          "⚠️ User not found in server or already left."
        );
      }

      if (!member.bannable) {
        return await interaction.editReply(
          "❌ I don't have permission to ban this user."
        );
      }

      await member.ban({ reason });
      await interaction.editReply(
        `🔨 **${user.tag}** has been banned.\n📝 Reason: ${reason}`
      );
    } catch (err) {
      console.error("🔥 Ban command error:", err);
      return await interaction.editReply(
        "❌ Failed to ban user. Internal error occurred."
      );
    }
  },
};
