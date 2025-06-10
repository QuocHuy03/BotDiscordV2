const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getSheetData } = require("../../ggsheet");
const { withVerificationCheck } = require("../../utils/withVerificationCheck");

const spreadsheetId = process.env.SHEET_ID;
const sheetRange = `${process.env.SHEET_NAME}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("📊 Show the top 10 users with the highest ITLG points"),

  execute: withVerificationCheck(async (interaction) => {
    await interaction.deferReply();

    try {
      const rows = await getSheetData(spreadsheetId, sheetRange);

      const validRows = rows
        .filter((r) => r[1] && r[2] && !isNaN(r[2]))
        .map((r) => ({ username: r[1], points: parseInt(r[2]) }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

      const medals = [
        "🥇",
        "🥈",
        "🥉",
        "4️⃣",
        "5️⃣",
        "6️⃣",
        "7️⃣",
        "8️⃣",
        "9️⃣",
        "🔟",
      ];

      const description = validRows
        .map(
          (r, i) =>
            `${medals[i]} \`${i + 1}.\` **${r.username}** – ${r.points} ITLG`
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🏆 Interlink Labs Leaderboard")
        .setDescription(description || "No data available.")
        .setColor("#fcd34d")
        .setFooter({ text: "Bot Notification" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("🔥 Error while fetching leaderboard:", err);
      await interaction.editReply(
        "❌ Unable to fetch leaderboard data. Please check the Google Sheets connection."
      );
    }
  }),
};
