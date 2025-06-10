const { hasVerifiedRole } = require("./roleCheck");

function withVerificationCheck(commandLogic) {
  return async (interaction) => {
    const result = await hasVerifiedRole(interaction);
    if (!result.verified) return;
    await commandLogic(interaction, result);
  };
}

module.exports = { withVerificationCheck };
