const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("🔨 Permanently ban a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName("target").setDescription("User to ban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Reason for ban").setRequired(false)
    ),

  async execute(interaction) {
    await safeDefer(interaction);
    await interaction.editReply("⏳ Verifying ban conditions...");

    await queue.add(async () => {
      try {
        const targetUser = interaction.options.getUser("target");
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!targetUser) {
          return await interaction.followUp({
            content: "❌ Cannot find the specified user.",
            ephemeral: true,
          });
        }

        if (targetUser.id === interaction.user.id) {
          return await interaction.followUp({
            content: "❌ You cannot ban yourself.",
            ephemeral: true,
          });
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
          return await interaction.followUp({
            content: "⚠️ User not found in server or already left.",
            ephemeral: true,
          });
        }

        if (!member.bannable) {
          return await interaction.followUp({
            content: "❌ I don't have permission to ban this user.",
            ephemeral: true,
          });
        }

        const authorMember = interaction.member;
        if (
          member.roles.highest.position >= authorMember.roles.highest.position &&
          interaction.guild.ownerId !== interaction.user.id
        ) {
          return await interaction.followUp({
            content: "⚠️ You cannot ban a member with equal or higher role than yours.",
            ephemeral: true,
          });
        }

        await member.ban({ reason });

        await interaction.followUp({
          content: `🔨 **${targetUser.tag}** has been banned.\n📝 Reason: ${reason}`,
          ephemeral: false,
        });

        console.log(
          `🔨 [BAN] ${interaction.user.tag} banned ${targetUser.tag} | Reason: ${reason}`
        );
      } catch (err) {
        console.error("🔥 Ban command error:", err);
        await interaction.followUp({
          content: "❌ Failed to ban user. An unexpected error occurred.",
          ephemeral: true,
        });
      }
    });
  },
};
