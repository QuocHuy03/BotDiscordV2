const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("🧹 Clear a number of recent messages from this channel")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    if (amount < 1 || amount > 100) {
      return await interaction.reply({
        content: "❌ Please enter a number between **1 and 100**.",
        ephemeral: true,
      });
    }

    await safeDefer(interaction);
    await interaction.editReply("⏳ Deleting messages...");

    await queue.add(async () => {
      try {
        const deletedMessages = await interaction.channel.bulkDelete(amount, true);

        if (deletedMessages.size === 0) {
          return await interaction.followUp({
            content: "⚠️ No messages were deleted. Messages older than **14 days** cannot be removed.",
            ephemeral: true,
          });
        }

        await interaction.followUp({
          content: `✅ Successfully deleted **${deletedMessages.size}** message(s).`,
          ephemeral: true,
        });

        console.log(
          `🧹 [CLEAR] ${interaction.user.tag} deleted ${deletedMessages.size} messages in #${interaction.channel.name}`
        );
      } catch (err) {
        console.error("❌ Error during /clear:", err);
        await interaction.followUp({
          content: "❌ Failed to delete messages. Please ensure I have **Manage Messages** permission.",
          ephemeral: true,
        });
      }
    });
  },
};
