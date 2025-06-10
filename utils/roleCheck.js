const { getSheetsInstance } = require("../ggsheet");

const verifyRoleId = process.env.VERIFY_ROLE_ID;
const level5RoleId = process.env.ROLE_LEVEL_5_ID;
const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:B`;

async function hasVerifiedRole(interaction) {
  const member = await interaction.guild.members.fetch(interaction.user.id);

  // ✅ Already has VERIFY role
  if (member.roles.cache.has(verifyRoleId)) {
    return { verified: true, justGranted: false };
  }

  // ❌ Missing Level 5
  if (!member.roles.cache.has(level5RoleId)) {
    const msg = "⚠️ You need to reach **Level 5** to verify. Keep engaging!";
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: msg, ephemeral: true });
    } else {
      await interaction.followUp({ content: msg, ephemeral: true });
    }
    return { verified: false, justGranted: false };
  }

  try {
    const sheets = await getSheetsInstance();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    const username = interaction.user.username;
    const found = rows.find(
      (row) =>
        row[1] === username &&
        row[0] &&
        typeof row[0] === "string" &&
        /^\d+$/.test(row[0]) // Must be valid INTERLINK ID
    );

    if (!found) {
      const msg = "❌ You must verify your INTERLINK ID first using the `/myid` command.";
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: msg, ephemeral: true });
      } else {
        await interaction.followUp({ content: msg, ephemeral: true });
      }
      return { verified: false, justGranted: false };
    }

    // ✅ All conditions met → Assign VERIFY role
    await member.roles.add(verifyRoleId);
    const msg = `🎉 You've been granted the **<@&${verifyRoleId}>** role after successful INTERLINK ID verification and reaching Level 5.`;
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: msg, ephemeral: true });
    } else {
      await interaction.followUp({ content: msg, ephemeral: true });
    }

    return { verified: true, justGranted: true };
  } catch (err) {
    console.error("❌ Google Sheets error:", err);
    const msg = "❌ Verification failed due to a system error. Please try again later.";
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: msg, ephemeral: true });
    } else {
      await interaction.followUp({ content: msg, ephemeral: true });
    }
    return { verified: false, justGranted: false };
  }
}

module.exports = { hasVerifiedRole };
