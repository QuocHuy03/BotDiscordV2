const { SlashCommandBuilder } = require("discord.js");
const { getSheetsInstance } = require("../../ggsheet");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:C`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myid")
    .setDescription("Set or update your INTERLINK ID")
    .addStringOption(option =>
      option
        .setName("custom_id")
        .setDescription("Enter your numeric INTERLINK ID (e.g. 98347846)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const customId = interaction.options.getString("custom_id");
    const username = interaction.user.username;

    if (!spreadsheetId || !sheetName) {
      return await interaction.editReply("❌ Sheet config missing. Contact the admin.");
    }

    if (!/^\d+$/.test(customId)) {
      return await interaction.editReply("❌ ID must be numeric only.");
    }

    try {
      const sheets = await getSheetsInstance();
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows = res.data.values || [];
      const foundIndex = rows.findIndex(row => row[1] === username);

      let message = "";

      if (foundIndex !== -1) {
        const updateRange = `${sheetName}!A${foundIndex + 2}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[`'${customId}`]],
          },
        });

        message = `✅ Your INTERLINK ID has been updated to **${customId}**.`;
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[`'${customId}`, username, 0]],
          },
        });

        message = `✅ INTERLINK ID **${customId}** saved successfully.`;
      }

      await interaction.editReply(message);
    } catch (err) {
      console.error("🔥 Google Sheets error:", err.response?.data || err.message || err);
      await interaction.editReply("❌ Failed to save your INTERLINK ID. Please try again later.");
    }
  },
};
