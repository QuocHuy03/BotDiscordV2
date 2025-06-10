// utils/antiSpam.js
const userMessageTimestamps = new Map();
const MESSAGE_LIMIT = parseInt(process.env.MESSAGE_LIMIT) || 5; // Default if not set
const TIME_FRAME = 10 * 1000; // 10 seconds
const TIMEOUT_DURATION = 30 * 1000; // 30 seconds

async function handleAntiSpam(message) {
  if (message.author.bot || !message.guild) return;

  const now = Date.now();
  const userId = message.author.id;

  const timestamps = userMessageTimestamps.get(userId) || [];
  timestamps.push(now);
  userMessageTimestamps.set(userId, timestamps.filter(t => now - t < TIME_FRAME));

  if (userMessageTimestamps.get(userId).length > MESSAGE_LIMIT) {
    try {
      const member = await message.guild.members.fetch(userId);

      // Skip if already muted or bot lacks permission
      if (member.isCommunicationDisabled()) return;
      if (!member.moderatable) {
        console.warn(`❌ Bot lacks permission to timeout user ${userId}`);
        return;
      }

      await member.timeout(TIMEOUT_DURATION, "🚫 Spamming too fast (anti-spam system)");
      await message.channel.send({
        content: `⚠️ <@${userId}> has been muted for **30 seconds** due to spamming.`,
        allowedMentions: { users: [userId] }
      });

      userMessageTimestamps.set(userId, []);
    } catch (err) {
      console.error("🔥 Failed to timeout user:", err);
    }
  }
}

module.exports = { handleAntiSpam };
