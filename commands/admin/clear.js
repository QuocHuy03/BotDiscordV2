const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("🧹 Clear a number of messages from the channel")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // ✅ Chỉ cho phép người có quyền xóa tin nhắn
    .setDMPermission(false),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    if (amount < 1 || amount > 100) {
      return await interaction.reply({
        content: "❌ You must enter a number between 1 and 100.",
        ephemeral: true, // 🔒 chỉ người gọi lệnh thấy
      });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        content: `✅ Cleared **${deleted.size} messages** from this channel.`,
        ephemeral: true, // 🔒 chỉ Admin thấy
      });
    } catch (error) {
      console.error("❌ Clear error:", error);
      await interaction.reply({
        content: "⚠️ I couldn't delete the messages. Please check if I have the right permissions.",
        ephemeral: true,
      });
    }
  },
};
