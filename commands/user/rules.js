const { SlashCommandBuilder } = require("discord.js");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("📜 Display the community rules to prevent spam"),

  async execute(interaction) {
    await safeDefer(interaction);
    await interaction.editReply("📜 Loading community rules...");

    await queue.add(async () => {
      const rulesMessage = `
📌 **INTERLINK COMMUNITY RULES** 📌

1️⃣ Do not spam messages, tags, emojis, or unrelated links.

2️⃣ Respect **Admins**, **Mods**, and all members. No personal attacks or toxic behavior.

3️⃣ Strictly no sharing of **NSFW**, political, hate speech, or illegal content.

4️⃣ Advertising, DMs, or Discord invites **without permission** is prohibited.

5️⃣ Use bot commands only for intended purposes. Each member is allowed **ONE account only**.

6️⃣ Violations may result in **warnings**, **mute**, or **permanent ban** depending on severity.

💬 For help, bug reports, or support, tag Admin or visit **#support**.

🙏 Thank you for helping us maintain a safe, respectful, and positive community!
      `;

      await interaction.followUp({
        content: rulesMessage,
        ephemeral: false, // public so everyone sees
      });
    });
  },
};
