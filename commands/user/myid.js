const { SlashCommandBuilder } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");
const { safeDefer } = require("../../utils/interactionUtils");
const queue = require("../../utils/queue");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myid")
    .setDescription("Set your INTERLINK ID (only once!)")
    .addStringOption(option =>
      option
        .setName("custom_id")
        .setDescription("Enter your numeric INTERLINK ID (e.g. 98347846)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await safeDefer(interaction);

    const customId = interaction.options.getString("custom_id");
    const username = interaction.user.username;

    if (!spreadsheetId || !sheetName) {
      return await interaction.editReply("❌ Sheet config missing. Contact the admin.");
    }

    if (!/^\d+$/.test(customId)) {
      return await interaction.editReply("❌ ID must be numeric only.");
    }

    // Phản hồi sớm để tránh interaction timeout
    await interaction.editReply("⏳ Processing your request... Please wait a moment.");

    // Đưa task vào hàng đợi
    await queue.add(async () => {
      try {
        const sheets = await getSheetsInstance();
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = res.data.values || [];

        const foundIndex = rows.findIndex(row => row[1] === username);
        const foundRow = foundIndex !== -1 ? rows[foundIndex] : null;

        if (foundRow && foundRow[0]) {
          return await interaction.followUp({
            content: `⚠️ You have already set your INTERLINK ID as **${foundRow[0]}**. It cannot be changed.`,
            ephemeral: true,
          });
        }

        if (foundRow) {
          const updateRange = `${sheetName}!A${foundIndex + 2}`;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[`'${customId}`]],
            },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[`'${customId}`, username, 0]],
            },
          });
        }

        await interaction.followUp({
          content: `✅ Your INTERLINK ID **${customId}** has been saved successfully.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("🔥 Error in /myid queue:", err);
        await interaction.followUp({
          content: "❌ Something went wrong while saving your ID. Please try again later.",
          ephemeral: true,
        });
      }
    });
  },
};
