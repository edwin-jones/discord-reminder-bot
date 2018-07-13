//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('scheduler');
const Agenda = require('agenda');
const moment = require('moment');
const parser = require('./parser');

const auth = require('./auth.json'); //you need to make this file yourself!

const genericErrorMessage = "Sorry, I didn't understand that."

/**
 * Creates a scheduler
 * @param {Object} bot the discord bot instance we are using to communicate with discord
 */
function Scheduler(bot) {

    /**
    * Use this function to set a reminder for a user
    *
    * @param userId the id of the user asking for the reminder to be set
    * @param channel the discord channel this request is coming from
    * @param {String} message the message from the user containing the reminder text and time
    */
    this.setReminder = async function (userId, channel, message) {

        if (!parser.validReminderString(message)) {

            await channel.send(genericErrorMessage);
            return;
        }

        var reminder = parser.getMessageAndDateFromReminderString(message);

        var reminderTime = moment(reminder.date);

        agenda.schedule(reminder.date, 'send reminder', { userId: userId, reminder: reminder.message });

        await channel.send(`OK **<@${userId}>**, on **${reminderTime.format('dddd, MMMM Do, YYYY [at] hh:mm:ss A')}** I will remind you **${reminder.message}**`);

        log("reminder set");
    }

    /**
    * Use this function to set a reminder for a user
    *
    * @param userId the id of the user asking for the reminder to be set
    * @param channel the discord channel this request is coming from
    * @param {String} message the message from the user containing the reminder text and time
    */
    this.snoozeReminder = async function (userId, channel, message) {

        if (!parser.validSnoozeString(message)) {

            await channel.send(genericErrorMessage);
            return;
        }

        let reminderDate = parser.getDateFromSnoozeString(message);

        let reminderTime = moment(reminderDate);

        let rawJob = await agenda._collection
            .find({ name: 'send reminder', 'data.userId': userId, nextRunAt: null })
            .sort({ lastRunAt: -1 })
            .limit(1)
            .next();

        if (rawJob == null) {
            await channel.send(`You have no reminders to snooze **<@${userId}>**`);
            return;
        }

        agenda.jobs({ _id: rawJob._id }, async (err, jobs) => {

            if (err) {
                log(`reminder snooze failed due to error: ${err}`);
                return;
            }

            //there will only be one job to work with due to the _id filter.
            let job = jobs[0];

            job.schedule(reminderDate);
            job.save();

            await channel.send(`OK **<@${userId}>**, on **${reminderTime.format('dddd, MMMM Do, YYYY [at] hh:mm:ss A')}** I will remind you **${job.attrs.data.reminder}**`);

            log("reminder snoozed");
        });
    }

    /**
    * Use this function to clear all reminders for a user
    *
    * @param userId the id of the user asking for the reminder to be set
    * @param channel the discord channel this request is coming from
    */
    this.clearReminders = async function (userId, channel) {

        agenda.cancel({ 'data.userId': userId }, async (err, numRemoved) => {

            let message = `Whups, something very bad happened. Please try again later.`;

            if (err) {
                message = `I couldn't remove your reminders **<@${userId}>**, please try again later.`
            }
            else {
                message = `I have removed all ${numRemoved} of your reminders **<@${userId}>**`
            }

            await channel.send(message);
        });

        log("reminders deleted for user " + userId);
    }

    /**
     * Use this function to send a reminder to a user
     *
     * @param userId the id of the user asking for the reminder to be set
     * @param {String} message the message from the user containing the reminder text and time
     */
    const sendReminder = async function (userId, message) {

        const user = await bot.fetchUser(userId);

        if (user == undefined) {

            log("user not found: " + userId)
            return;
        }

        const channel = await user.createDM();

        if (channel == undefined) {

            log("dm channel not found for user " + userId)
            return;
        }

        await channel.send(`Hey **<@${userId}>**, remember **${message}**`);

        log("reminder sent to user " + userId);
    }

    //create agenda instance.
    //it will ping the DB every minute but jobs are held in memory as well, so reminders will run on time.
    const agenda = new Agenda({ db: { address: auth.mongourl, collection: 'agenda' } }).processEvery('one minute');

    //make sure we only try to use agenda when it's ready
    agenda.on('ready', async function () {

        //define our only job, the 'send reminder' job.
        agenda.define('send reminder', async (job, done) => {

            const data = job.attrs.data;
            await sendReminder(data.userId, data.reminder);

            //this is an async func, call done to mark it as complete.
            done();
        });

        //start the scheduler.
        await this.start();
    });
}


//always assign an already defined functions to exports or you will get a singleton!
//see https://medium.com/@iaincollins/how-not-to-create-a-singleton-in-node-js-bd7fde5361f5
module.exports = Scheduler;