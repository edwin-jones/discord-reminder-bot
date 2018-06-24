//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

/**
 * @module scheduler
 */


const log = require('debug')('scheduler');
const Agenda = require('agenda');
const moment = require('moment');
const parser = require('./parser');

const auth = require('./auth.json'); //you need to make this file yourself!

/** Class that allows you to schedule reminders */
class Scheduler {

    /**
    * Creates a scheduler
    * @param {Object} bot the discord bot instance we are using to communicate with discord
    */
    constructor(bot) {

        /**
        * Use this function to set a reminder for a user
        *
        * @param {String} userId the id of the user asking for the reminder to be set
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

            agenda.schedule(reminder.date, 'send reminder', { userId: userId, channelId: channel.id, reminder: reminder.message });

            await channel.send(`Ok **<@${userId}>**, On **${reminderTime.format('LLL')}** I will remind you **${reminder.message}**`);

            log("remindme command completed");
        }

        /**
        * Use this function to clear all reminders for a user
        *
        * @param userId the id of the user asking for the reminder to be set
        * @param channel the channel to send the reminder to
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
        }

        /**
         * Use this function to send a reminder to a user
         *
         * @param userId the id of the user asking for the reminder to be set
         * @param channel the channel to send the reminder to
         * @param {String} message the message from the user containing the reminder text and time
         */
        const sendReminder = async function (userId, channelId, message) {

            const channel = bot.channels.get(channelId);

            if (channel == undefined) {

                log("channel not found: " + channelId)
                return;
            }

            await channel.send(`Hey **<@${userId}>**, remember **${message}**`);

            log("reminder sent");
        }

        //create agenda instance.
        //it will ping the DB every minute but jobs are held in memory as well, so reminders will run on time.
        const agenda = new Agenda({ db: { address: auth.mongourl, collection: 'agenda' } }).processEvery('one minute');

        //make sure we only try to use agenda when it's ready
        agenda.on('ready', async function () {

            //define our only job, the 'send reminder' job.
            agenda.define('send reminder', async (job, done) => {

                const data = job.attrs.data;
                await sendReminder(data.userId, data.channelId, data.reminder);

                //remove job from DB to stop old jobs filling it up
                job.remove(error => {

                    if (error) {

                        log(`failed to remove job ${job.attrs._id} from DB because of error: ${error}`);
                    }
                });

                //this is an async func, call done to mark it as complete.
                done();
            });

            //start the scheduler.
            await this.start();
        });
    }
}

//always assign an already defined class/method to exports or you will get a singleton!
//see https://medium.com/@iaincollins/how-not-to-create-a-singleton-in-node-js-bd7fde5361f5
module.exports = Scheduler;