const fs = require("fs");
const path = require("path");
const { getSheetsInstance } = require("../ggsheet");
const { saveNotifiedUsers, getNotifiedUsers } = require("../utils/notifiedManager");
const roleMap = require("../config/roleMap");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:B`;

const GUILD_ID = process.env.GUILD_ID;
const ROLE_LEVEL_5_ID = process.env.ROLE_LEVEL_5_ID;

async function autoNotiTrusteds(client) {
  try {
    const sheets = await getSheetsInstance();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();

    const notifiedUsers = getNotifiedUsers();
    const trustedRoleId = roleMap.TRUSTED_HUMAN;
    const trustedRole = guild.roles.cache.get(trustedRoleId);

    for (const [interlinkId, username] of rows) {
      if (!/^\d+$/.test(interlinkId)) continue;

      const member = guild.members.cache.find((m) => m.user.username === username);
      if (!member) continue;

      const hasLv5 = member.roles.cache.has(ROLE_LEVEL_5_ID);
      const hasTrusted = member.roles.cache.has(trustedRoleId);
      const alreadyNotified = (notifiedUsers[trustedRoleId] || []).includes(member.id);

      if (hasLv5 && !hasTrusted) {
        try {
          await member.roles.add(trustedRole);
          console.log(`✅ Granted role ${trustedRole.name} to ${username}`);

          if (!alreadyNotified) {
            await member.send(`🎉 You've been verified and granted the **${trustedRole.name}** role in the server!`);
            if (!notifiedUsers[trustedRoleId]) notifiedUsers[trustedRoleId] = [];
            notifiedUsers[trustedRoleId].push(member.id);
            saveNotifiedUsers(notifiedUsers);
            console.log(`📩 Notification sent to ${username}`);
          }

        } catch (err) {
          console.error(`❌ Error verifying ${username}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("🔥 autoNotiTrusteds Error:", err);
  }
}

module.exports = { autoNotiTrusteds };
