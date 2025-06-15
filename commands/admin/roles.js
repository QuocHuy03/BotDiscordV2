const { SlashCommandBuilder, AttachmentBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("📜 View a categorized list of all members by roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await safeDefer(interaction);

    queue.add(async () => {
      try {
        const members = await interaction.guild.members.fetch();
        const admins = [];
        const users = [];

        members.forEach(member => {
          if (member.user.bot) return;

          const isAdmin = member.roles.cache.some(role =>
            role.permissions.has(PermissionsBitField.Flags.Administrator)
          );

          const line = `- ${member.user.username} (ID: ${member.user.id})`;
          isAdmin ? admins.push(line) : users.push(line);
        });

        // 🔤 Sort alphabetically
        admins.sort((a, b) => a.localeCompare(b));
        users.sort((a, b) => a.localeCompare(b));

        let output = `👑 **Admins (${admins.length}):**\n${admins.join("\n")}\n\n` +
          `👤 **Users (${users.length}):**\n${users.join("\n")}`;

        if (output.length <= 1900) {
          const message = [
            "📋 Member role list:",
            "```",
            output,
            "```"
          ].join("\n");

          await interaction.editReply(message);

        } else {
          const buffer = Buffer.from(output, "utf-8");
          const file = new AttachmentBuilder(buffer, { name: "member_roles.txt" });
          await interaction.editReply({
            content: "📁 The list is too long. Here's the file instead:",
            files: [file]
          });
        }

      } catch (err) {
        console.error("🔥 Error during role classification:", err);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ Failed to fetch member roles. Please check bot permissions.");
        } else {
          await interaction.reply({
            content: "❌ An unexpected error occurred.",
            ephemeral: true
          });
        }
      }
    });
  }
};
