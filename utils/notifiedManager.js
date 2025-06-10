const fs = require("fs");
const path = require("path");


const notifiedPath = path.join(__dirname, "../data/notified.json");

function getNotifiedUsers() {
  if (!fs.existsSync(notifiedPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(notifiedPath, "utf-8"));
  } catch (err) {
    console.error("❌ Failed to parse notified.json:", err.message);
    return {};
  }
}

function saveNotifiedUsers(data) {
  try {
    fs.writeFileSync(notifiedPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Failed to save notified.json:", err.message);
  }
}


module.exports = {
  getNotifiedUsers,
  saveNotifiedUsers,
};
