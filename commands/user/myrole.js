const { SlashCommandBuilder } = require("discord.js");
const { withVerificationCheck } = require("../../utils/withVerificationCheck");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("myrole")
    .setDescription("Display all roles you currently have in this server"),

   execute: withVerificationCheck(async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const result = await hasVerifiedRole(interaction);
    if (!result.verified) return;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => `<@&${role.id}>`);

    const content = roles.length === 0
      ? "⚠️ You don't have any roles in this server."
      : `🎓 Your current roles:\n\n${roles.join("\n")}`;

    await interaction.editReply({ content });
  }),
};
