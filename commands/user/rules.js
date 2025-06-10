const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("📜 Display the community rules to prevent spam"),

  async execute(interaction) {
    
    const rulesMessage = `
📌 **INTERLINK COMMUNITY RULES** 📌

1️⃣ Do not spam messages, tags, emojis, or unrelated links.

2️⃣ Respect Admins, Mods, and all members. No personal attacks.

3️⃣ No sharing of inappropriate content, politics, hate speech, or illegal material.

4️⃣ No advertising or inviting to other groups/Discords without permission.

5️⃣ Use bot commands only for intended purposes. Each person is allowed **only ONE account**.

6️⃣ Violations may result in warnings, mutes, or permanent bans depending on severity.

👉 For questions, bug reports, or support, contact Admin in #support or tag directly.

🙏 Thank you for following the rules! Let’s build a positive and respectful community together!
    `;

    await interaction.reply({ content: rulesMessage, ephemeral: false });
  },
};
