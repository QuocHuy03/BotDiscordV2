const { hasVerifiedRole } = require("./roleCheck");

function withVerificationCheck(commandLogic) {
    console.log(commandLogic);
  return async (interaction) => {
    const result = await hasVerifiedRole(interaction);
    if (!result.verified) return;
    await commandLogic(interaction, result);
  };
}

module.exports = { withVerificationCheck };
