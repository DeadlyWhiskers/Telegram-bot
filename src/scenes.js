const { Scenes, session, Markup } = require("telegraf")
const { message } = require("telegraf/filters") 
// const { Pool, Client } = require("pg")
const { userPool, adminPool, doctorPool } = require("./pools")

class SceneGen {

    async ClearScreen(ctx) {
        console.log(ctx.session.message_id_tempMG)
        ctx.session.message_id_tempMG.forEach(i => ctx.deleteMessage(i))
        ctx.session.message_id_tempMG = []
    }

    ShowError(ctx){
        ctx.reply('Извините, произошла ошибка', 
            Markup.inlineKeyboard([
            Markup.button.callback('В главное меню', 'reenterMenu')])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
    }

    GenMainScene() {
        const MainScene = new Scenes.BaseScene('MainScene')
        MainScene.enter(async (ctx) => {
            ctx.session.message_id_tempMG.push((await ctx.replyWithPhoto({source: './photos/main.jfif'},
            {
                caption: `Здравствуйте, добро пожаловать в санаторий \"Рядом с Ялтой\"!
Комплекс расположен на южном берегу крымского полуострова, недалеко от Севастополя.
У нас вы сможете отдохнуть в красивых корпусах в нескольких стилях, прогуляться по живописному парку, 
поплавать в тёплом море и покормить котиков. Желаем приятного отдыха!`,
reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback('Цены и корпуса🏢','pricelist'),
                Markup.button.callback('Узнать о питании🥐','foodlist')],
                [Markup.button.callback('Кнопка3','b3'),
                Markup.button.callback('Кнопка4','b4')],
                [Markup.button.callback('Бронь🗓️','reservationMenu')]
            ]).reply_markup
        })).message_id)
        })
        MainScene.command('secretmenu', async (ctx) => {
            this.ClearScreen(ctx)
            ctx.deleteMessage()
            console.log(ctx.session.message_id_temp)
            ctx.session.message_id_tempMG.push((await ctx.reply('Вы открыли секретное меню для персонала, кем вы являетесь?', 
            Markup.inlineKeyboard([
                [Markup.button.callback('Я врач💊', 'doctorMenu')],
                [Markup.button.callback('Я администратор🖥️', 'adminMenu')],
                [Markup.button.callback('Вернуться в главное меню❌', 'reenterMenu')],

            ]))).message_id)
        })
        MainScene.action('doctorMenu', async (ctx) => {
            this.ClearScreen(ctx)
            ctx.session.message_id_tempMG.push((await ctx.replyWithPhoto({source: './photos/doctor.jpg'}, 
            {
                caption: `Здравствуйте, (Сюда вставить имя врача, полученное из бд),
Добро пожаловать в меню врача, что вы хотите сделать?`,
                reply_markup: Markup.inlineKeyboard(
                    [Markup.button.callback('Выход из меню❌','reenterMenu')]
                ).reply_markup
            })).message_id)
        })
        MainScene.action('adminMenu', async (ctx) => {
            this.ClearScreen(ctx)
            ctx.session.message_id_tempMG.push((await ctx.replyWithPhoto({source: './photos/shodan.jfif'}, 
            {
                caption: `Здравствуйте, ${ctx.update.callback_query.from.first_name}!
Добро пожаловать в меню администратора, что вы хотите сделать?`,
                reply_markup: Markup.inlineKeyboard(
                    [Markup.button.callback('Выход из меню❌','reenterMenu')]
                ).reply_markup
            })).message_id)
        })
        MainScene.action('reenterMenu', async (ctx) => {
            this.ClearScreen(ctx)
            ctx.scene.reenter()
        })
        MainScene.action('pricelist', async (ctx) => {
            this.ClearScreen(ctx)
            // Тута показано, как работать с менюшками в таблицах с несколькими картинками, очень ВАЖНО!!
            userPool.query("select * from building ORDER BY room_price").then(result => {
                var messageText = `В нашем санатории есть ${result.rows.length} прекрасных корпуса, каждый впечатляет по-своему:`
                result.rows.forEach((item, index) => {
                    messageText += '\n' + (index+1) + '. ' + '*' + item['building_name'] + '*' + '\nЦена места - ' + item['room_price'] + 'руб/сутки :\n' + item['buidling_desc']
                })
                var mediaObjArr = []
                result.rows.forEach((item) => {
                    mediaObjArr.push({type: 'photo', media: {source: item['img_path']}})
                })
                mediaObjArr[0]['caption'] = messageText
                mediaObjArr[0]['parse_mode'] = 'Markdown'
                ctx.replyWithMediaGroup(mediaObjArr).then(result => {
                    result.forEach((item) => ctx.session.message_id_tempMG.push(item['message_id']))
                    ctx.reply('ㅤ', Markup.inlineKeyboard([
                    Markup.button.callback('Бронь🗓️', 'reservationMenu'),
                    Markup.button.callback('В главное меню🏠', 'reenterMenu')
                    ])).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))})

            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        MainScene.action('foodlist', async (ctx) => {
            await this.ClearScreen(ctx)
            userPool.query('select feeding_name, feeding_price, img_path from feeding_type').then(result => {
                var messageText = `Наш санаторий может предложить вам самую разнообразную еду со всего мира. Меню меняется каждый день. От салатов до овсяных шариков, голодными вы не останетесь!`
                result.rows.forEach((item, index) => {
                    messageText += '\n' + (index+1) + ' *' + item.feeding_name + '*' + '\n' + 'Цена: ' + item.feeding_price
                    + ' руб/чел/сут.'
                })
                var mediaObjArr = []
                result.rows.forEach((item) => {
                    mediaObjArr.push({type: 'photo', media: {source: item['img_path']}})
                })
                mediaObjArr[0]['caption'] = messageText
                mediaObjArr[0]['parse_mode'] = 'Markdown'
                ctx.replyWithMediaGroup(mediaObjArr).then(result => {
                    result.forEach((item) => ctx.session.message_id_tempMG.push(item['message_id']))
                    ctx.reply('ㅤ', Markup.inlineKeyboard([
                    Markup.button.callback('В главное меню🏠', 'reenterMenu')])).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))})
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        MainScene.action('reservationMenu', async (ctx) => {
            this.ClearScreen(ctx)
            console.log(ctx.from.first_name, ctx.from.last_name, ctx.update.callback_query.from.username)
            userPool.query(`select * from reservation where reservation_id = ${ctx.from.id}`).then(result => {
                if(result.rowCount == 0){
                    ctx.reply('Вы пока не бронировали у нас мест, хотите это сделать?',
                    Markup.inlineKeyboard([
                        Markup.button.callback('Забронировать места✅', 'enterReservationMenu'),
                        Markup.button.callback('Нет, спасибо❌', 'reenterMenu'),
                    ])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
                }
                else{
                    ctx.reply('беброчка')
                }
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        MainScene.action('enterReservationMenu', async (ctx) => {
            await this.ClearScreen(ctx)
            ctx.scene.enter('DateInScene')
        })
        return MainScene
    }
    GenDateInScene(){
        const DateInScene = new Scenes.BaseScene( 'DateInScene')
            DateInScene.enter(async (ctx) => {
                ctx.session.message_id_tempMG.push((await ctx.reply('Здравствуйте, вы попали в меню бронирования.')).message_id)
                ctx.session.message_id_tempMG.push((await ctx.reply('Введите дату вашего заеда', {reply_markup: {force_reply: true, input_field_placeholder: 'YYYY MM DD'}})).message_id)
                console.log(ctx.session.message_id_tempMG)
                ctx.session.message_id_tempMG.push((await ctx.reply('ㅤ', Markup.inlineKeyboard([Markup.button.callback('Отмена❌', 'returnToMainMenu')]))).message_id)
                console.log(ctx.session.message_id_tempMG)
            })
            DateInScene.on(message('text'), async (ctx) => {
                ctx.session.date = []
                ctx.session.message_id_tempMG.push(ctx.message.message_id)
            if (ctx.message.text.trim().split(' ').length != 3) {
                    await this.ClearScreen(ctx)
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Дата была введена неверно')).message_id)
                    ctx.scene.reenter()
            }
            else{
                await this.ClearScreen(ctx)
                ctx.message.text.trim().split(' ').forEach(async item => {
                if(isNaN(item)){
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Дата была введена неверно')).message_id)
                    ctx.scene.reenter()
                }
                ctx.session.date.push(item)})
                console.log(ctx.session.date)
                console.log(Date.parse(`${ctx.session.date[0]}-${ctx.session.date[1]}-${ctx.session.date[2]}`))
                if(Date.parse(`${ctx.session.date[0]}-${ctx.session.date[1]}-${ctx.session.date[2]}`) == 0 ||
                isNaN(Date.parse(`${ctx.session.date[0]}-${ctx.session.date[1]}-${ctx.session.date[2]}`)) ||
                Date.parse(`${ctx.session.date[0]}-${ctx.session.date[1]}-${ctx.session.date[2]}`) < new Date())
                {
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Дата была введена неверно')).message_id)
                    ctx.scene.reenter()
                }
                else{
                    await this.ClearScreen(ctx)
                    return ctx.scene.enter('DaysOutScene')
                }
            }
        }
        )
        DateInScene.action('returnToMainMenu', async ctx => {
            await this.ClearScreen(ctx)
            ctx.scene.enter('MainScene')
        })
        return DateInScene
    }
    GenDaysOutScene(){
        const DaysOutScene = new Scenes.BaseScene('DaysOutScene')
        DaysOutScene.enter(async (ctx) => {
            ctx.session.message_id_tempMG.push((await ctx.reply('На сколько дней вы хотите остаться?', {reply_markup: {force_reply: true, input_field_placeholder: 'Вводить сюда'}})).message_id)
            ctx.session.message_id_tempMG.push((await ctx.reply('ㅤ', Markup.inlineKeyboard([Markup.button.callback('Отмена❌', 'returnToMainMenu')]))).message_id)
            })
        DaysOutScene.on(message('text'), async (ctx) => {
            if(isNaN(ctx.message.text) || ctx.message.text < 0){
                ctx.session.message_id_tempMG.push(ctx.message.message_id)
                await this.ClearScreen(ctx)
                await ctx.session.message_id_tempMG.push((await ctx.reply('Неправильно введены дни')).message_id)
                ctx.scene.reenter()
            }
            else {
                ctx.session.days = ctx.message.text
                ctx.session.message_id_tempMG.push(ctx.message.message_id)
                await this.ClearScreen(ctx)
                ctx.session.formattedDateIn = `to_date('${ctx.session.date[0]} ${ctx.session.date[1]} ${ctx.session.date[2]}', 'YYYY MM DD')`
                ctx.session.tempDate = new Date(ctx.session.date[0],ctx.session.date[1]-1,ctx.session.date[2])
                ctx.session.tempDate.setDate(ctx.session.tempDate.getDate() + parseInt(ctx.session.days))
                ctx.session.formattedDateOut = `to_date('${ctx.session.tempDate.getFullYear()} ${ctx.session.tempDate.getMonth()+1} ${ctx.session.tempDate.getDate()}', 'YYYY MM DD')`
                ctx.scene.enter('PeopleAmountScene')
            }
            })
        DaysOutScene.action('returnToMainMenu', async ctx => {
            await this.ClearScreen(ctx)
            ctx.scene.enter('MainScene')
        })
        return DaysOutScene
    }
    GenPeopleAmountScene(){
        const PeopleAmountScene = new Scenes.BaseScene('PeopleAmountScene')
        PeopleAmountScene.enter(async (ctx) => {
            await userPool.query(`WITH room_spaces AS (SELECT building_id, room_id, capacity, (capacity -
                (SELECT COALESCE(SUM(people_amount),0) from room join reservation on reservation.room_id = room_base.room_id where
                                room.room_id = room_base.room_id AND ((${(ctx.session.formattedDateIn)} BETWEEN date_in AND date_out) OR
                                                        (${(ctx.session.formattedDateOut)} BETWEEN date_in AND date_out) OR
                                                        (date_in BETWEEN ${(ctx.session.formattedDateIn)} and ${(ctx.session.formattedDateOut)})))) as beds_available FROM room as room_base ORDER BY room_id)
                SELECT room_spaces.room_id, building_name, room_price, room_spaces.capacity, room_spaces.beds_available FROM room_spaces join building on room_spaces.building_id = building.building_id where beds_available > 0`).then( result => {
                    ctx.session.gotQuery = result
                }).catch(e => {
                    console.log(e)
                    this.ShowError(ctx)
                    ctx.scene.enter('MainScene')
                })
                if (ctx.session.gotQuery.rowCount == 0) ctx.session.message_id_tempMG.push((await ctx.reply('Простите, на эти даты всё занято', Markup.inlineKeyboard([Markup.button.callback('Жаль...❌', 'returnToMainMenu')]))).message_id)
                else {ctx.session.buttonlist = []
                ctx.session.maxBeds = Math.max(...ctx.session.gotQuery.rows.map(row => parseInt(row.beds_available)))
                for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.maxBeds; ctx.session.tempi++) {
                    if(ctx.session.tempi%3 == 0)ctx.session.buttonlist.push([])
                    ctx.session.buttonlist[Math.floor(ctx.session.tempi/3)].push(
                        Markup.button.callback(ctx.session.tempi+1, ctx.session.tempi+1)
                        )
                }
                ctx.session.buttonlist.push([Markup.button.callback('Отмена❌', 'returnToMainMenu')])
                ctx.session.message_id_tempMG.push((await ctx.reply(`На эти даты есть номера со следующим числом свободных мест, выберите подходящий варинат:`, Markup.inlineKeyboard(ctx.session.buttonlist))).message_id)
            }})

            PeopleAmountScene.action(/.*/, async (ctx) => {
                await this.ClearScreen(ctx)
                if(ctx.update.callback_query.data == 'returnToMainMenu') ctx.scene.enter('MainScene')
                else {
                ctx.session.amount = ctx.update.callback_query.data
                ctx.scene.enter('RoomScene')
                }
            })
        return PeopleAmountScene
    }
    GenRoomScene(){
        const RoomScene = new Scenes.BaseScene('RoomScene')
        RoomScene.enter(async (ctx) => {
            ctx.session.buttonlist = []
            ctx.session.gotQuery.rows.forEach((item) => ctx.session.buttonlist.push([]))
            ctx.session.buttonlist.push([Markup.button.callback('Отмена❌', 'returnToMainMenu')])
            ctx.session.gotQuery.rows.forEach((item, index) => {
                if (item.beds_available >= ctx.session.amount) ctx.session.buttonlist[index].push(
                    Markup.button.callback(`${item.building_name.slice(0, 14)} Своб: ${item.beds_available}/${item.capacity}, ${item.room_price*ctx.session.amount*ctx.session.days} руб`, item.room_id)
                    )
            });
            ctx.reply(`Выберите для себя подходящий номер:`, Markup.inlineKeyboard(ctx.session.buttonlist)).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))
            })
        RoomScene.action(/.*/, async (ctx) => {
            await this.ClearScreen(ctx)
                if(ctx.update.callback_query.data == 'returnToMainMenu') ctx.scene.enter('MainScene')
                else {
                    ctx.session.room_id = ctx.update.callback_query.data
                    ctx.scene.enter('FoodScene')
                }
            })
        return RoomScene
    }
    GenFoodScene(){
        const FoodScene = new Scenes.BaseScene('FoodScene')
        FoodScene.enter(async (ctx) => {
            userPool.query(`select feeding_id, feeding_name, feeding_price from feeding_type`).then(result => {
                ctx.session.buttonlist = []
                result.rows.forEach((item) => ctx.session.buttonlist.push([]))
                ctx.session.buttonlist.push([Markup.button.callback('Отмена❌', 'returnToMainMenu')])
                result.rows.forEach((item, index) => {
                    ctx.session.buttonlist[index].push(
                        Markup.button.callback(`${item.feeding_name} - Цена: ${item.feeding_price*ctx.session.amount*ctx.session.days} руб`, item.feeding_id)
                        )
                });
                ctx.reply(`Выберите тип питания:`, Markup.inlineKeyboard(ctx.session.buttonlist)).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
        })
            })
        FoodScene.action(/.*/, async (ctx) => {
            await this.ClearScreen(ctx)
                if(ctx.update.callback_query.data == 'returnToMainMenu') ctx.scene.enter('MainScene')
                else {
                    ctx.session.feeding_id = ctx.update.callback_query.data
                    ctx.scene.enter('GuestsScene')
                }
            })
        return FoodScene
    }
    GenGuestsnScene(){
        const GuestsScene = new Scenes.BaseScene('GuestsScene')
        GuestsScene.enter(async (ctx) => {
            ctx.session.message_id_tempMG.push((await ctx.reply('Теперь введите даннные всех гостей подряд: Имя Фамилия Отчество(если нет, то поставить 0) Пол(М/Ж) Возраст Телефон?', {reply_markup: {force_reply: true, input_field_placeholder: 'Вводить сюда'}})).message_id)
            console.log(ctx.session.message_id_tempMG)
            ctx.session.message_id_tempMG.push((await ctx.reply('ㅤ', Markup.inlineKeyboard([Markup.button.callback('Отмена❌', 'returnToMainMenu')]))).message_id)
        })
        GuestsScene.on(message('text'), async ctx => {
            ctx.session.failed = false
            ctx.session.guests = []
            ctx.session.message_id_tempMG.push(ctx.message.message_id)
            await this.ClearScreen(ctx)
            ctx.message.text.trim().split(/\s+/).forEach(item => {
                ctx.session.guests.push(item)
            })
            console.log(ctx.session.guests)
            if(ctx.session.guests.length < 6*ctx.session.amount){
                await this.ClearScreen(ctx)
                await ctx.session.message_id_tempMG.push((await ctx.reply('Неправильно введены гости')).message_id)
                ctx.scene.reenter()
            }
            else {
                for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                    console.log(6*ctx.session.tempi+3, ctx.session.guests[6*ctx.session.tempi+3])
                if(ctx.session.guests[6*ctx.session.tempi+3] != 'М' && ctx.session.guests[6*ctx.session.tempi+3] != 'Ж'){
                    console.log(ctx.session.guests[6*ctx.session.tempi+3], 'sex fail')
                    ctx.session.failed = true
                }else if (ctx.session.guests[6*ctx.session.tempi+3] == 'М') {ctx.session.guests[6*ctx.session.tempi+3] = 'M'
            }
                else if (ctx.session.guests[6*ctx.session.tempi+3] == 'Ж') ctx.session.guests[6*ctx.session.tempi+3] = 'F'
                if(isNaN(ctx.session.guests[6*ctx.session.tempi+4])){
                    console.log(ctx.session.guests[6*ctx.session.tempi+4], 'nan fail')
                    ctx.session.failed = true
                }
            }
            console.log(ctx.session.guests)
            if(ctx.session.failed == true){
                    await this.ClearScreen(ctx)
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Неправильно введены гости')).message_id)
                    ctx.scene.reenter()
                } else  ctx.scene.enter('ConfirmationScene')
            }
        })
        return GuestsScene
    }
    GenConfirmationScene(){
        const ConfirmationScene = new Scenes.BaseScene('ConfirmationScene')
        ConfirmationScene.enter(async (ctx) => {
            ctx.session.addQuery = ''
            ctx.session.curval = parseInt((await userPool.query('SELECT last_value FROM guest_id_seq')).rows[0].last_value)+1
            ctx.session.addQuery += 'insert into guest values'
            for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                ctx.session.addQuery += `(nextval('guest_id_seq'), '${ctx.session.guests[6*ctx.session.tempi+5]}', '${ctx.session.guests[6*ctx.session.tempi]}',
                '${ctx.session.guests[6*ctx.session.tempi+1]}', '${ctx.session.guests[6*ctx.session.tempi+2]}', '${ctx.session.guests[6*ctx.session.tempi+3]}', ${ctx.session.guests[6*ctx.session.tempi+4]}),`
            }
            ctx.session.addQuery = ctx.session.addQuery.substring(0, ctx.session.addQuery.length-1) + ';\n'
            ctx.session.addQuery += `insert into reservation values(${ctx.from.id},${ctx.session.room_id},
                ${ctx.session.formattedDateIn},
                ${ctx.session.formattedDateOut},
                ${ctx.session.feeding_id},0,${ctx.session.amount});\n`
                ctx.session.addQuery += 'insert into reservation_rel values '
            for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                ctx.session.addQuery += `(${ctx.from.id}, ${parseInt(ctx.session.curval)+ctx.session.tempi}),`
            }
            ctx.session.addQuery = ctx.session.addQuery.substring(0, ctx.session.addQuery.length-1) + ';\n'
            console.log(ctx.session.addQuery)
            userPool.query(ctx.session.addQuery).then(result => {
                ctx.reply('Бронь успешно создана', Markup.inlineKeyboard([Markup.button.callback('Ура✅', 'returnToMainMenu')])).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        ConfirmationScene.action('returnToMainMenu', async ctx => {
            await this.ClearScreen(ctx)
            ctx.scene.enter('MainScene')
        })
        return ConfirmationScene
    }
}

module.exports = SceneGen