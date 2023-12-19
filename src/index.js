require("./logic")
require("./bot")

process.once('SIGINT', (bot) => bot.stop('SIGINT'))
process.once('SIGTERM', (bot) => bot.stop('SIGTERM'))

console.log(process.env.BOT_TOKEN)