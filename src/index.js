require("./logic")
require("./bot")
//Graceful stop (idk what it does but it works)
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

console.log(process.env.BOT_TOKEN)