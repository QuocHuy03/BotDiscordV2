const { getSheetsInstance } = require("../ggsheet");
const {
  saveNotifiedUsers,
  getNotifiedUsers,
} = require("../utils/notifiedManager");
const roleMap = require("../config/roleMap");

const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const range = `${sheetName}!A2:B`; // A: custom_id, B: username

const GUILD_ID = process.env.GUILD_ID;
const ROLE_LEVEL_5_ID = process.env.ROLE_LEVEL_5_ID;

async function autoNotiTrusteds(client) {
  try {
    const sheets = await getSheetsInstance();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    const guild = await client.guilds.fetch(GUILD_ID);
    const allMembers = await guild.members.fetch();
    console.log(`📥 Loaded ${allMembers.size} members`);

    const notifiedUsers = getNotifiedUsers();
    const trustedRoleId = roleMap.TRUSTED_HUMAN;
    const trustedRole = guild.roles.cache.get(trustedRoleId);

    for (const [customIdRaw, usernameRaw] of rows) {
      const customId = customIdRaw?.trim();
      const username = usernameRaw?.trim().toLowerCase();

      if (!customId || !username) {
        console.log(`⏩ Bỏ qua dòng vì thiếu custom_id hoặc username`);
        continue;
      }

      const member = allMembers.find(
        (m) => m.user.username.toLowerCase() === username
      );

      if (!member) {
        console.warn(`⛔ Không tìm được user có username: ${username}`);
        continue;
      }

      const hasLv5 = member.roles.cache.has(ROLE_LEVEL_5_ID);
      const hasTrusted = member.roles.cache.has(trustedRoleId);
      const alreadyNotified = (notifiedUsers[trustedRoleId] || []).includes(
        member.id
      );

      // ✅ Nếu có LV5 nhưng chưa có TRUSTED → Cấp
      if (hasLv5 && !hasTrusted) {
        try {
          await member.roles.add(trustedRole);
          console.log(
            `✅ Gán role ${trustedRole.name} cho ${member.user.username}`
          );

          if (!alreadyNotified) {
            await member.send(
              `🎉 Bạn đã được xác minh và nhận role **${trustedRole.name}**!`
            );
            if (!notifiedUsers[trustedRoleId])
              notifiedUsers[trustedRoleId] = [];
            notifiedUsers[trustedRoleId].push(member.id);
            saveNotifiedUsers(notifiedUsers);
            console.log(
              `📩 Đã gửi tin nhắn xác nhận cho ${member.user.username}`
            );
          }
        } catch (err) {
          console.error(
            `❌ Lỗi khi gán role cho ${member.user.username}:`,
            err.message
          );
        }
      } else {
        if (!hasLv5)
          console.log(`⏩ ${member.user.username} chưa có ROLE_LEVEL_5`);
        if (hasTrusted) console.log(`⏩ ${member.user.username} đã có TRUSTED`);
      }

      // ❌ Nếu CÓ TRUSTED nhưng KHÔNG còn LV5 → Gỡ
      if (!hasLv5 && hasTrusted) {
        try {
          await member.roles.remove(trustedRole);
          console.log(
            `🚫 Đã gỡ role ${trustedRole.name} khỏi ${member.user.username}`
          );
        } catch (err) {
          console.error(
            `❌ Lỗi khi gỡ role cho ${member.user.username}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("🔥 autoNotiTrusteds Error:", err);
  }
}

module.exports = { autoNotiTrusteds };
