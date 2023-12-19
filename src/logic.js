const { Markup, Scenes, session } = require("telegraf")
const bot = require("./bot")
const SceneGen = require("./scenes")

const SceneGenerator = new SceneGen
const MainScene = SceneGenerator.GenMainScene()
const DateInScene = SceneGenerator.GenDateInScene()
const DaysOutScene = SceneGenerator.GenDaysOutScene()
const PeopleAmountScene = SceneGenerator.GenPeopleAmountScene()
const RoomScene = SceneGenerator.GenRoomScene()
const FoodScene = SceneGenerator.GenFoodScene()
const ConfirmationScene = SceneGenerator.GenConfirmationScene()
const GuestsScene = SceneGenerator.GenGuestsnScene()
const DoctorGuardScene = SceneGenerator.GenDoctorGuardScene()
const DoctorNameScene = SceneGenerator.GenDoctorNameScene()
const DoctorSpecializationScene = SceneGenerator.GenDoctorSpecializationScene()
const DoctorMainMenu = SceneGenerator.GenDoctorMainMenu()
const ProceduresMenu = SceneGenerator.GenProceduresMenu()
const AddProcedureMenu = SceneGenerator.GenAddProcedureMenu()
const DoctorGuestsScene = SceneGenerator.GenDoctorGuestsScene()
const GuestIllnessMenuScene = SceneGenerator.GenGuestIllnessMenuScene()
const GuestIllnessAddScene = SceneGenerator.GenGuestIllnessAddScene()

//Using the scenes
const stage = new Scenes.Stage([MainScene, DateInScene, DaysOutScene, PeopleAmountScene, RoomScene, FoodScene, ConfirmationScene, GuestsScene,
    DoctorGuardScene, DoctorNameScene, DoctorSpecializationScene, DoctorMainMenu, ProceduresMenu, AddProcedureMenu,
    DoctorGuestsScene, GuestIllnessMenuScene, GuestIllnessAddScene])
bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    ctx.session.message_id_tempMG = []
    ctx.session.message_id_temp = (await ctx.reply("Здравствуйте, сейчас вы будете перенаправлены в меню")).message_id
    ctx.deleteMessage(ctx.session.message_id_temp)
    ctx.scene.enter('MainScene');
})

bot.action('returnToMainMenu', async ctx => {
    ctx.scene.enter('MainScene')
})

bot.launch()