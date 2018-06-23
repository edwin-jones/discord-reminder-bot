//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('scheduler');
const Agenda = require('agenda');
const moment = require('moment');
const parser = require('./parser');

const auth = require('./auth.json'); //you need to make this file yourself!

module.exports = function Scheduler(bot) {

    /**
     * Use this function to set a reminder for a user
     *
     * @param userId the id of the user asking for the reminder to be set
     * @param {Object} channel the channel to send the reminder to
     * @param {String} message the message from the user containing the reminder text and time
     */
    this.setReminder = async function (userId, channel, message) {

        if (!parser.validateReminderString(message)) {
            await channel.send("You didn't give me a future date or valid message for the reminder");
            return;
        }

        var reminder = parser.getMessageAndDateFromReminderString(message);

        var reminderTime = moment(reminder.date);

        this.agenda.schedule(reminder.date, 'send reminder', { userId: userId, channelId: channel.id, reminder: reminder.message });

        await channel.send(`Ok **<@${userId}>**, On **${reminderTime.format('LLL')}** I will remind you **${reminder.message}**`);

        log("remindme command completed");
    }

    /**
     * Use this function to send a reminder to a user
     *
     * @param userId the id of the user asking for the reminder to be set
     * @param channel the channel to send the reminder to
     * @param {String} message the message from the user containing the reminder text and time
     */
    this.sendReminder = async function (userId, channelId, message) {
        let channel = bot.channels.get(channelId);

        if (channel == undefined) {
            log("channel not found: " + channelId)
            return;
        }

        await channel.send(`Hey **<@${userId}>**, remember **${message}**`);

        log("reminder sent");
    }

    /**
    * Use this function to clear all reminders for a user
    *
    * @param userId the id of the user asking for the reminder to be set
    * @param channel the channel to send the reminder to
    */
    this.clearReminders = async function (userId, channel) {
        this.agenda.cancel({ 'data.userId': userId }, async (err, numRemoved) => {

            let message = `Whups, something very bad happened. Please try again later.`;

            if (err) {
                message = `I couldn't remove your reminders **<@${userId}>**, please try again later.`
            }
            else {
                message = `I have removed all ${numRemoved} of your reminders **<@${userId}>**`
            }

            await channel.send(message);

        });
    }

    //create agenda instance.
    //it will ping the DB every minute but jobs are held in memory as well, so reminders will run on time.
    this.agenda = new Agenda({ db: { address: auth.mongourl, collection: 'agenda' } }).processEvery('one minute');

    //make sure we only try to use agenda when it's ready
    this.agenda.on('ready', async function () {

        //define our only job, the 'send reminder' job.
        this.define('send reminder', async (job, done) => {

            let data = job.attrs.data;
            await this.sendReminder(data.userId, data.channelId, data.reminder); //FIX THIS???

            //remove job from DB to stop old jobs filling it up
            job.remove();

            //this is an async func, call done to mark it as complete.
            done();

        });

        //start the scheduler.
        await this.start();
    });
}