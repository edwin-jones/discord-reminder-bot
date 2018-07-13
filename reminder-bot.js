//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

//dependencies
const log = require('debug')('reminder-bot');
const discord = require('discord.js');
const Scheduler = require('./scheduler');
const parser = require('./parser');

const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "Hi there, I'm reminder bot!\n" +
    "You can see this message again by typing **!help**.\n" +
    "You can set a reminder for yourself with the command **!remindme [about a thing] [at a time in the future]**.\n" +
    "You can snooze the most recent reminder you received with **!snooze [for a time / until a time in the future]**.\n" +
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

//Initialize Discord Bot
let bot = new discord.Client();

//Initialize scheduler
let scheduler = new Scheduler(bot);

//log when the bot is ready
bot.on('ready', (evt) => {

    log('connected');
    log('logged in as: ');
    log(`${bot.user.username} - (${bot.user.id})`);
});

// Decide what to do when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', async (message) => {

    try {

        // the bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.content.substring(0, 1) == '!') {

            log('recieved a command!')

            let messageContent = message.content.substring(1);
            let command = messageContent.split(' ')[0];
            let parameters = messageContent.substring(messageContent.indexOf(' ') + 1);

            switch (command) {

                // handle commands
                case 'help':
                    await message.channel.send(helpmsg);
                    log("help command executed");
                    break;

                case 'remindme':
                    await scheduler.setReminder(message.author.id, message.channel, parameters);
                    break;

                case 'snooze':
                    await scheduler.snoozeReminder(message.author.id, message.channel, parameters);
                    break;

                case 'forgetme':
                    await scheduler.clearReminders(message.author.id, message.channel);
                    break;
            }
        }
    }
    catch (err) {

        onError(message.channel, err);
    }
});

//start the bot by making it log in to discord.
bot.login(auth.token);