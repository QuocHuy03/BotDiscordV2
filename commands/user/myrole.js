const { SlashCommandBuilder } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myrole")
    .setDescription("Display all roles you currently have in this server"),

  async execute(interaction) {
    await safeDefer(interaction);
    await interaction.editReply("⏳ Fetching your roles... please wait.");

    await queue.add(async () => {
      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const roles = member.roles.cache
          .filter(role => role.id !== interaction.guild.id)
          .map(role => `<@&${role.id}>`);

        const content = roles.length === 0
          ? "⚠️ You don't have any roles in this server."
          : `🎓 Your current roles:\n\n${roles.join("\n")}`;

        await interaction.followUp({
          content,
          ephemeral: true,
        });
      } catch (error) {
        console.error("❌ Error in /myrole:", error);
        await interaction.followUp({
          content: "❌ Failed to fetch your roles.",
          ephemeral: true,
        });
      }
    });
  },
};
