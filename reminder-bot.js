// Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

//dependencies
const discord = require('discord.js');
const log = require('debug')('reminder-bot');
const chrono  = require('chrono-node');
const moment = require('moment');

const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "I am a work in progress and may not perform as you expect." +
    "You can see this message again by typing **!help**." +
    "You can set a reminder for yourself with the command **!remindme [about a thing] [at a time in the future]**.";


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
async function setReminder(channel, message) {

    var parsedDate = chrono.parse(message, new Date(), {forwardDate: true})[0];

    if(parsedDate == undefined)
    {
        await channel.send("No date provided for reminder");
        return;
    }

    var reminder = message.replace(parsedDate.text, "").trim();
    var reminderTime = moment(parsedDate.start.date());

    await channel.send(`On **${reminderTime.format('LLL')}** I will remind you to **${reminder}**`)

    log("remindme command completed");
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
                    await setReminder(message.channel, parameters)
                    break;
            }
        }
    }
    catch (err) {

        onError(message.channel, err);
    }
});

bot.login(auth.token);