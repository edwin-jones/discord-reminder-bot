// Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

//dependencies
const discord = require('discord.js');
const log = require('debug')('reminder-bot');
const chrono  = require('chrono-node');
const moment = require('moment');
const Agenda = require('agenda');

const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "I am a work in progress and may not perform as you expect.\n" +
    "You can see this message again by typing **!help**.\n" +
    "You can set a reminder for yourself with the command **!remindme [about a thing] [at a time in the future]**.\n"+
    "You can remove all your reminders with **!forgetme**.";


/**
 * Error handler
 *
 * @param channel the text channel to send the message to
 * @param err the error message to log
 */
async function onError(channel, err) {

    log(err);
    await channel.send("Looks like even I forget things, like how to do what you just asked. Please ask me again later.");
}

/**
 * Use this function to set a reminder for a user
 *
 * @param channel the channel to send the reminder to
 * @param message the message from the user containing the reminder text and time
 */
async function setReminder(userId, channelId, message) {

    var parsedDate = chrono.parse(message, new Date(), {forwardDate: true})[0];

    if(parsedDate == undefined)
    {
        await channel.send("You didn't give me a date for the reminder");
        return;
    }

    var reminder = message.replace(parsedDate.text, "").trim();

    if(!reminder)
    {
        await channel.send("You didn't give me a message for the reminder");
        return;
    }

    var reminderTime = moment(parsedDate.start.date());

    if(reminderTime <= new Date())
    {
        await channel.send("I cannot set reminders for dates that are in the past");
        return;
    }

    agenda.schedule(reminderTime, 'send reminder', { userId: userId, channelId: channelId, reminder: message });

    await channel.send(`Ok **<@${userId}>**, On **${reminderTime.format('LLL')}** I will remind you to **${reminder}**`);

    log("remindme command completed");
}

async function sendReminder(userId, channelId, message)
{
    let channel = bot.channels.get(channelId);

    if(channel == undefined)
    {
        log("channel not found: " + channelId)
        return;
    }

    await channel.send(`Hey **<@${userId}>**, remember to: **${message}**`);

    log("reminder sent");
}

async function clearReminders(userId, channel)
{
    await channel.send(`I have removed all your reminders **<@${userId}>**`);
}

// Initialize Discord Bot
var bot = new discord.Client();

//log when the bot is ready
bot.on('ready', (evt) => {

    log('connected');
    log('logged in as: ');
    log(`${bot.user.username} - (${bot.user.id})`);
});

//handle disconnects by auto reconnecting
bot.on('disconnect', (erMsg, code) => {

    log(`----- bot disconnected from Discord with code ${code} for reason: ${erMsg} -----`);
    bot.connect();
})

// Decide what to do when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', async (message) => {

    try {

        // catbot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.content.substring(0, 1) == '!') {

            log('recieved a command!')

            let messageContent = message.content.substring(1);
            let command = messageContent.split(' ')[0];
            let parameters =  messageContent.substring(messageContent.indexOf(' ') + 1);

            switch (command) {

                // handle commands
                case 'help':
                    await message.channel.send(helpmsg);
                    log("help command executed");
                    break;

                case 'remindme':
                    await setReminder(message.author.id, message.channel.id, parameters);
                    break;
                
                case 'forgetme':
                    await clearReminders(message.author.id, message.channel);
                    break;
            }
        }
    }
    catch (err) {

        onError(message.channel, err);
    }
});

bot.login(auth.token);

const agenda = new Agenda({db: {address: auth.mongourl, collection: 'agenda'}}).processEvery('one minute');

agenda.on('ready', async function() {

    agenda.define('send reminder', async (job, done) => {
        await sendReminder(job.attrs.data.userId, job.attrs.data.channelId, job.attrs.data.message);
        done();
      });

    await agenda.start();
});