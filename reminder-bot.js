//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

//dependencies
const log = require('debug')('reminder-bot');
const discord = require('discord.js');
const Scheduler = require('./scheduler');

const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "Hi there, I'm reminder bot!\n" +
    "You can see this message again by typing **!help**\n" +
    "You can set a reminder for yourself by typing **!remindme [about a thing] [at a time in the future]**\n" +
    "You can snooze the most recent reminder you received by typing **!snooze [for a time / until a time in the future]**\n" +
    "You can snooze all the reminders you have received by typing **!snoozeall [for a time / until a time in the future]**\n" +
    "You can remove the most recent reminder you received by typing **!clear**\n" +
    "You can remove all the reminders you have received by typing **!clearall**\n" +
    "You can list your upcoming reminders by typing **!list**\n" + 
    "You can remove all your reminders by typing **!forgetme**";

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

                case 'snoozeall':
                    await scheduler.snoozeReminders(message.author.id, message.channel, parameters);
                    break;

                case 'list':
                    await scheduler.listReminders(message.author.id, message.channel);
                    break;

                case 'clear':
                    await scheduler.clearActiveReminder(message.author.id, message.channel);
                    break;

                case 'clearall':
                    await scheduler.clearActiveReminders(message.author.id, message.channel);
                    break;

                case 'forgetme':
                    await scheduler.clearAllReminders(message.author.id, message.channel);
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