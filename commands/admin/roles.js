const { SlashCommandBuilder, AttachmentBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("📜 View a categorized list of all members by roles")
     .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const members = await interaction.guild.members.fetch();
      const admins = [];
      const users = [];

      members.forEach(member => {
        if (member.user.bot) return;

        const isAdmin = member.roles.cache.some(role =>
          role.permissions.has(PermissionsBitField.Flags.Administrator)
        );
        const line = `- ${member.user.username} (ID: ${member.user.id})`;

        if (isAdmin) {
          admins.push(line);
        } else {
          users.push(line);
        }
      });

      let output = `👑 **Admin (${admins.length}):**\n${admins.join("\n")}\n\n`;
      output += `👤 **User (${users.length}):**\n${users.join("\n")}`;

      if (output.length <= 2000) {
        await interaction.editReply(`📋 Member role list:\n\`\`\`\n${output}\n\`\`\``);
      } else {
        const buffer = Buffer.from(output, "utf-8");
        const file = new AttachmentBuilder(buffer, { name: "member_roles.txt" });
        await interaction.editReply({ content: "📁 Member list too long, sent as file:", files: [file] });
      }

    } catch (err) {
      console.error("🔥 Error during role classification:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Failed to fetch member roles. Check bot permissions.");
      } else {
        await interaction.reply("❌ Unexpected error occurred.");
      }
    }
  }
};
