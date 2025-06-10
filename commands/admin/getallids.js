const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getallids")
        .setDescription("📋 Retrieve a list of all usernames and Discord IDs in the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const members = await interaction.guild.members.fetch();
            const data = members
                .filter(member => !member.user.bot)
                .map(m => `${m.user.username} - ${m.user.id}`)
                .join("\n");

            const MAX_MESSAGE_LENGTH = 2000;

            if (data.length <= MAX_MESSAGE_LENGTH) {
                await interaction.editReply(`📋 User list:\n\`\`\`\n${data}\n\`\`\``);
            } else {
                const buffer = Buffer.from(data, "utf-8");
                const file = new AttachmentBuilder(buffer, { name: "user_ids.txt" });

                await interaction.editReply({
                    content: `📁 The user list is too long. Sending as an attached file:`,
                    files: [file],
                });
            }
        } catch (err) {
            console.error("🔥 Error while fetching user list:", err);
            await interaction.editReply("❌ Failed to retrieve user list. Please check bot permissions.");
        }
    }
};
