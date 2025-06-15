const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("👢 Kick a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option.setName("target").setDescription("User to kick").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for kick").setRequired(false)
    ),

  async execute(interaction) {
    await safeDefer(interaction);

    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!targetUser) {
      return await interaction.editReply("❌ Cannot find the specified user.");
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return await interaction.editReply("⚠️ User is not in this server.");
    }

    // Không cho kick chính mình
    if (targetUser.id === interaction.user.id) {
      return await interaction.editReply("❌ You cannot kick yourself.");
    }

    // Kiểm tra quyền role
    const authorMember = interaction.member;
    if (
      member.roles.highest.position >= authorMember.roles.highest.position &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return await interaction.editReply(
        "⚠️ You cannot kick a member with equal or higher role than yours."
      );
    }

    if (!member.kickable) {
      return await interaction.editReply("❌ I don't have permission to kick this user.");
    }

    await queue.add(async () => {
      try {
        await member.kick(reason);

        await interaction.followUp({
          content: `👢 **${targetUser.tag}** has been kicked.\n📝 Reason: ${reason}`,
          ephemeral: true,
        });

        console.log(`🚫 [KICK] ${interaction.user.tag} kicked ${targetUser.tag} – ${reason}`);
      } catch (err) {
        console.error("🔥 Kick command failed:", err);
        await interaction.followUp({
          content: "❌ Failed to kick the user. Please try again.",
          ephemeral: true,
        });
      }
    });
  },
};
