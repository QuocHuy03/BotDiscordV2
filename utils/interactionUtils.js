// utils/interactionUtils.js
async function safeDefer(interaction, options = { ephemeral: true }) {
  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply(options);
    } catch (err) {
      console.error("❌ Failed to defer reply:", err);
    }
  }
}

module.exports = { safeDefer };
