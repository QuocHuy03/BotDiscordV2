let memberCache = new Map();

async function cacheAllMembers(guild) {
  const members = await guild.members.fetch(); // ⚠️ Cần GUILD_MEMBERS intent
  members.forEach((member) => {
    memberCache.set(member.user.username.toLowerCase(), member);
  });
  console.log(`📦 Đã cache ${memberCache.size} users`);
}

function getMemberByUsername(username) {
  return memberCache.get(username.toLowerCase()) || null;
}

module.exports = {
  cacheAllMembers,
  getMemberByUsername,
};
