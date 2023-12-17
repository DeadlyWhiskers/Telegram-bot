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
            Markup.button.callback('В главное меню', 'returnToMainMenu')])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
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
        MainScene.action('returnToMainMenu', async (ctx) => {
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
            userPool.query(`select building_name, room.room_id, feeding_type.feeding_name, reservation.reservation_price, to_char(date_in, 'YYYY-MM-DD') as date_in, to_char(date_out, 'YYYY-MM-DD') as date_out,
            extract(day from date_out::timestamp-date_in::timestamp) as nights 
            from reservation join feeding_type on feeding_type.feeding_id = reservation.feeding_id
            join room on room.room_id = reservation.room_id join building on building.building_id = room.building_id where reservation_id = ${ctx.from.id}`).then(result => {
                ctx.session.reservation = result
                if(result.rowCount == 0){
                    ctx.reply('Вы пока не бронировали у нас мест, хотите это сделать?',
                    Markup.inlineKeyboard([
                        Markup.button.callback('Забронировать места✅', 'enterReservationMenu'),
                        Markup.button.callback('Нет, спасибо❌', 'reenterMenu'),
                    ])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
                }
                else{
                    userPool.query(`select * from guest join reservation_rel on guest.guest_id = reservation_rel.guest_id
                    where reservation_id = ${ctx.from.id}`).then(result => {
                        ctx.session.guests = ''
                        result.rows.forEach(row => {
                            ctx.session.guests += `${row.guest_name} ${row.guest_surname} ${row.guest_patronymic}\n`
                        })
                        ctx.replyWithPhoto({source: './photos/reception.jfif'},
                        {
                            caption: `Здравствуйте, ${ctx.from.first_name}, вы забронировали места на ${result.rowCount} человек в номере ${ctx.session.reservation.rows[0].room_id} на даты:
${ctx.session.reservation.rows[0].date_in.split('-').join('.')} \u2014 ${ctx.session.reservation.rows[0].date_out.split('-').join('.')} (${ctx.session.reservation.rows[0].nights} ночей).
Корпус проживания \u2014 ${ctx.session.reservation.rows[0].building_name}
Тип питания \u2014 ${ctx.session.reservation.rows[0].feeding_name}
Общая стоимость \u2014 ${ctx.session.reservation.rows[0].reservation_price} руб.

Список проживающих:
${ctx.session.guests}`,
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback('В главное меню🏠','reenterMenu')],
                            [Markup.button.callback('Список процедур🩺','seeProcedures'),
                            Markup.button.callback('Удалить бронь🗑️','removeReservation')]
                        ]).reply_markup
                        }).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id))
                    }).catch(e => {
                        console.log(e)
                        this.ShowError(ctx)
                    })
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
        MainScene.action('removeReservation', async (ctx) => {
            await this.ClearScreen(ctx)
            ctx.reply(`Вы действительно хотите удалить бронь?:`,
                    Markup.inlineKeyboard([
                        Markup.button.callback('Да✅', 'removeReservationQuery'),
                        Markup.button.callback('Нет❌', 'reservationMenu')
                    ])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
        })
        MainScene.action('removeReservationQuery', async (ctx) => {
            await this.ClearScreen(ctx)
            userPool.query(`select delete_reservation(${ctx.from.id})`).then(()=>{
                ctx.reply(`Бронь успешно удалена`,
                Markup.inlineKeyboard([
                    Markup.button.callback('Понятно👍', 'reenterMenu')
                ])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        MainScene.action('seeProcedures', async (ctx) => {
            await this.ClearScreen(ctx)
            userPool.query(`select guest_name, dense_rank() over (ORDER BY guest_name)-1 as guest_pos, guest_surname, guest_patronymic, doctor_patronymic, doctor_name, doctor_specialization, procedure_name, to_char(procedure_day, 'YYYY-MM-DD') as procedure_day, to_char(procedure_start, 'HH24:MI') as procedure_start, to_char(procedure_end, 'HH24:MI') as procedure_end, procedure_price, cabinet 
            from procedure_appointment join guest on 
            procedure_appointment.guest_id = guest.guest_id join procedure_ on 
            procedure_appointment.procedure_id = procedure_.procedure_id join doctor on
            procedure_.doctor_id = doctor.doctor_id 
            join reservation_rel on 
            guest.guest_id = reservation_rel.guest_id where reservation_id = ${ctx.from.id}`).then(result => {
                if (result.rowCount != 0){ctx.session.procedureList = []
                    for (ctx.session.tempi = 0; ctx.session.tempi <= Math.max(...result.rows.map(row => parseInt(row.guest_pos))); ctx.session.tempi++)
                    ctx.session.procedureList.push('')
                    result.rows.forEach((item, index) => {
                        if(ctx.session.procedureList[item.guest_pos].length == 0) ctx.session.procedureList[item.guest_pos] = `${parseInt(item.guest_pos)+1} ${item.guest_name} ${item.guest_surname}:\n`
                        ctx.session.procedureList[item.guest_pos] += `   ${item.procedure_name}\n   Время: ${item.procedure_start}-${item.procedure_end} Дата: ${item.procedure_day.split('-').join('.')}\n   Врач: ${item.doctor_name} ${item.doctor_patronymic}\n   ${item.doctor_specialization}\n   Кабинет: ${item.cabinet} Цена:${item.procedure_price} руб.\n\n`
                    })
                    ctx.session.procedureList = ctx.session.procedureList.join('')
                    ctx.reply(`Вот список всех ваших процедур:\n${ctx.session.procedureList}`,
                    Markup.inlineKeyboard([
                        Markup.button.callback('Понятно✅', 'reservationMenu')
                    ])).then(result => ctx.session.message_id_tempMG.push(result.message_id))
                }
                else (ctx.reply('Ни у кого из вашего номера нет назначенных процедур.', Markup.inlineKeyboard([Markup.button.callback('Понятно✅', 'reservationMenu')])).then(result1 => ctx.session.message_id_tempMG.push(result1.message_id)))
            }).catch(e => {
                console.log(e)
                this.ShowError(ctx)
            })
        })
        return MainScene
    }
    GenDateInScene(){
        const DateInScene = new Scenes.BaseScene( 'DateInScene')
            DateInScene.enter(async (ctx) => {
                ctx.session.message_id_tempMG.push((await ctx.reply('Здравствуйте, вы попали в меню бронирования.')).message_id)
                ctx.session.message_id_tempMG.push((await ctx.reply('Введите дату вашего заеда', {reply_markup: {force_reply: true, input_field_placeholder: 'YYYY MM DD'}})).message_id)
                ctx.session.message_id_tempMG.push((await ctx.reply('ㅤ', Markup.inlineKeyboard([Markup.button.callback('Отмена❌', 'returnToMainMenu')]))).message_id)
            })
            DateInScene.on(message('text'), async (ctx) => {
                ctx.session.date = []
                ctx.session.message_id_tempMG.push(ctx.message.message_id)
            if (ctx.message.text.trim().split(/\s+/).length != 3) {
                    await this.ClearScreen(ctx)
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Дата была введена неверно')).message_id)
                    ctx.scene.reenter()
            }
            else{
                await this.ClearScreen(ctx)
                ctx.message.text.trim().split(/\s+/).forEach(async item => {
                if(isNaN(item)){
                    await ctx.session.message_id_tempMG.push((await ctx.reply('Дата была введена неверно')).message_id)
                    ctx.scene.reenter()
                }
                ctx.session.date.push(item)})
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
            if(ctx.session.guests.length < 6*ctx.session.amount){
                await this.ClearScreen(ctx)
                await ctx.session.message_id_tempMG.push((await ctx.reply('Неправильно введены гости')).message_id)
                ctx.scene.reenter()
            }
            else {
                for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                if(ctx.session.guests[6*ctx.session.tempi+3] != 'М' && ctx.session.guests[6*ctx.session.tempi+3] != 'м' && ctx.session.guests[6*ctx.session.tempi+3] != 'Ж' && ctx.session.guests[6*ctx.session.tempi+3] != 'ж'){
                    console.log(ctx.session.guests[6*ctx.session.tempi+3], 'sex fail')
                    ctx.session.failed = true
                }else if (ctx.session.guests[6*ctx.session.tempi+3] == 'М' || ctx.session.guests[6*ctx.session.tempi+3] == 'м') {ctx.session.guests[6*ctx.session.tempi+3] = 'M'
            }
                else if (ctx.session.guests[6*ctx.session.tempi+3] == 'Ж' || ctx.session.guests[6*ctx.session.tempi+3] == 'ж') ctx.session.guests[6*ctx.session.tempi+3] = 'F'
                if(isNaN(ctx.session.guests[6*ctx.session.tempi+4])){
                    console.log(ctx.session.guests[6*ctx.session.tempi+4], 'nan fail')
                    ctx.session.failed = true
                }
            }
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
            console.log(ctx.session.guests)
            console.log(ctx.session.room_id)
            console.log(ctx.session.amount)
            console.log(ctx.session.feeding_id)
            console.log(ctx.session.formattedDateIn)
            console.log(ctx.session.formattedDateOut)
            console.log('Метка')
            ctx.session.addQuery = ''
            ctx.session.curval = parseInt((await userPool.query('SELECT last_value FROM guest_id_seq')).rows[0].last_value)+1
            console.log('Метка')
            ctx.session.addQuery += 'insert into guest values'
            console.log('Метка')
            for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                ctx.session.addQuery += `(nextval('guest_id_seq'), '${ctx.session.guests[6*ctx.session.tempi+5]}', '${ctx.session.guests[6*ctx.session.tempi]}',
                '${ctx.session.guests[6*ctx.session.tempi+1]}', '${ctx.session.guests[6*ctx.session.tempi+2]}', '${ctx.session.guests[6*ctx.session.tempi+3]}', ${ctx.session.guests[6*ctx.session.tempi+4]}),`
            }
            console.log('Метка')
            ctx.session.addQuery = ctx.session.addQuery.substring(0, ctx.session.addQuery.length-1) + ';\n'
            console.log('Метка')
            ctx.session.addQuery += `insert into reservation values(${ctx.from.id},${ctx.session.room_id},
                ${ctx.session.formattedDateIn},
                ${ctx.session.formattedDateOut},
                ${ctx.session.feeding_id},0,${ctx.session.amount});\n`
                ctx.session.addQuery += 'insert into reservation_rel values '
                console.log('Метка')
            for(ctx.session.tempi = 0; ctx.session.tempi < ctx.session.amount; ctx.session.tempi++){
                ctx.session.addQuery += `(${ctx.from.id}, ${parseInt(ctx.session.curval)+ctx.session.tempi}),`
            }
            console.log('Метка')
            ctx.session.addQuery = ctx.session.addQuery.substring(0, ctx.session.addQuery.length-1) + ';\n'
            console.log('Метка')
            console.log(ctx.session.addQuery)
            userPool.query(ctx.session.addQuery).then(result => {
                console.log('Метка')
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