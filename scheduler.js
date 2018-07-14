//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('scheduler');
const moment = require('moment');
const Agenda = require('agenda');
const StringBuilder = require('string-builder');
const parser = require('./parser');

const auth = require('./auth.json'); //you need to make this file yourself!

const genericParserErrorMessage = "Sorry, I didn't understand that."
const genericSchedulerErrorMessage = "Sorry, I couldn't do that at this time. Please try again later."

const reminderJobName = "send reminder";
const dateFormatString = "dddd, MMMM Do, YYYY [at] hh:mm:ss A"

/**
 * Creates a scheduler
 * @param {Object} bot the discord.js bot instance we are using to communicate with discord
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

            await channel.send(genericParserErrorMessage);
            return;
        }

        var reminder = parser.getMessageAndDateFromReminderString(message);

        var reminderTime = moment(reminder.date);

        agenda.schedule(reminder.date, reminderJobName, { userId: userId, reminder: reminder.message });

        await channel.send(`OK **<@${userId}>**, on **${reminderTime.format(dateFormatString)}** I will remind you **${reminder.message}**`);

        log(`reminder set for user ${userId}`);
    }

    /**
    * Use this function to set a reminder for a user
    *
    * @param userId the id of the user asking for a reminder to be snoozed
    * @param channel the discord channel this request is coming from
    * @param {String} message the message from the user containing the snooze time
    */
    this.snoozeReminder = async function (userId, channel, message) {

        if (!parser.validSnoozeString(message)) {

            await channel.send(genericParserErrorMessage);
            return;
        }

        let reminderDate = parser.getDateFromSnoozeString(message);

        let reminderTime = moment(reminderDate);

        //find the most recently run reminder job for a user.
        //we have to do this with a raw mongo query so we can sort and limit.
        let rawJob = await agenda._collection
            .find({ name: reminderJobName, 'data.userId': userId, nextRunAt: null })
            .sort({ lastRunAt: -1 })
            .limit(1)
            .next();

        if (rawJob == null) {
            await channel.send(`You have no reminders to snooze **<@${userId}>**`);
            return;
        }

        //_id always has a unique index in mongo so this search should always find one record
        agenda.jobs({ _id: rawJob._id }, async (err, jobs) => {

            if (err) {
                log(`reminder snooze failed due to error: ${err}`);
                return;
            }

            //there will only be one job to work with due to the _id filter.
            let job = jobs[0];

            job.schedule(reminderDate);
            job.save();

            await channel.send(`OK **<@${userId}>**, on **${reminderTime.format(dateFormatString)}** I will remind you **${job.attrs.data.reminder}**`);

            log(`reminder snoozed for user ${userId}`);
        });
    }

    /**
   * Use this function to list all upcoming reminders for a user
   *
   * @param userId the id of the user asking for the list of reminders
   * @param channel the discord channel this request is coming from
   */
    this.listReminders = async function (userId, channel) {

        agenda.jobs({ name: reminderJobName, 'data.userId': userId, nextRunAt: { $ne: null } }, async (err, jobs) => {

            if (err) {

                await channel.send(genericSchedulerErrorMessage);
                return;
            }
            else if (jobs.length === 0) {

                await channel.send(`You have no reminders pending **<@${userId}>**`);
                return;
            }
            else {

                var sb = new StringBuilder();
                sb.appendLine(`OK **<@${userId}>**, I have found the following upcoming reminders for you:`)


                //sort upcoming jobs so the soonest to run is first, latest to run is last.
                jobs.sort(function(a, b) {
                    return a.attrs.nextRunAt - b.attrs.nextRunAt;
                });

                for (let job of jobs) {

                    let id = job.attrs._id;
                    let nextRunAt = moment(job.attrs.nextRunAt);
                    let reminder = job.attrs.data.reminder;

                    sb.appendLine(`\tID: **${id}**\tTime: **${nextRunAt.format(dateFormatString)}**\tMessage: **${reminder}**`);
                }

                await channel.send(sb.toString());
            }

            log(`list reminders request processed for user ${userId}`);
        });
    }

    /**
    * Use this function to clear all reminders for a user
    *
    * @param userId the id of the user asking for the reminder to be set
    * @param channel the discord channel this request is coming from
    */
    this.clearReminders = async function (userId, channel) {

        agenda.cancel({ name: reminderJobName, 'data.userId': userId }, async (err, numRemoved) => {

            let message = `Whups, something very bad happened. Please try again later.`;

            if (err) {
                message = `I couldn't remove your reminders **<@${userId}>**, please try again later.`
            }
            else {
                message = `I have removed all ${numRemoved} of your reminders **<@${userId}>**`
            }

            await channel.send(message);

            log(`delete reminders request processed for user ${userId}`);
        });
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


//always assign an already defined function to exports or you will get a singleton!
//see https://medium.com/@iaincollins/how-not-to-create-a-singleton-in-node-js-bd7fde5361f5
module.exports = Scheduler;