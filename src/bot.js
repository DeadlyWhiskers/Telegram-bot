const {Telegraf} = require('telegraf')
const {Markup, Router} = Telegraf
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN)
module.exports = bot