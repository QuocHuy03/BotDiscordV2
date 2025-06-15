const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getallids")
    .setDescription("📋 Retrieve all usernames and Discord IDs in this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await safeDefer(interaction);
    await interaction.editReply("⏳ Fetching member list...");

    await queue.add(async () => {
      try {
        const members = await interaction.guild.members.fetch();
        const filtered = members.filter(m => !m.user.bot);
        const total = filtered.size;

        const lines = filtered.map((m) => `${m.user.tag} - ${m.user.id}`);
        const data = lines.join("\n");

        if (data.length <= 2000) {
          await interaction.followUp({
            content: `📋 **User list (${total} members):**\n\`\`\`\n${data}\n\`\`\``,
            ephemeral: true,
          });
        } else {
          const buffer = Buffer.from(data, "utf-8");
          const file = new AttachmentBuilder(buffer, { name: "user_ids.txt" });

          await interaction.followUp({
            content: `📁 **Exported ${total} members.** Sent as a file because it's too long:`,
            files: [file],
            ephemeral: true,
          });
        }

        console.log(`📤 [GETALLIDS] Exported ${total} users for ${interaction.user.tag}`);
      } catch (err) {
        console.error("🔥 Error while running /getallids:", err);
        await interaction.followUp({
          content: "❌ Failed to retrieve user list. Please check bot permissions.",
          ephemeral: true,
        });
      }
    });
  },
};
