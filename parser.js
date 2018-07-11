//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('parser');
const chrono = require('chrono-node');
const moment = require('moment');

//set up the humanInterval module. Make sure to replace any words we want to ignore with '1'
//in the language map as this will stop the parser mistaking them for numbers and miscalculating
//the snooze
const humanInterval = require('human-interval');
humanInterval.languageMap['for'] = 1

/**
 * Use this function to check to see if a reminder string is valid
 *
 * @param {string} reminderString the string to validate. Must contain a message and time.
 * @returns {boolean} a boolean value representing if the reminder is valid or not.
 */
module.exports.validateReminderString = (reminderString) => {

    var parsedDate = chrono.parse(reminderString, new Date(), { forwardDate: true })[0];

    if (parsedDate == undefined) {
        return false;
    }

    //remove whitespace from message
    var reminderMessage = reminderString.replace(parsedDate.text, "").trim();

    //remove all unprintable chars from message (ASCII 32-127 ONLY)
    reminderMessage = reminderMessage.replace(/[^\x20-\x7F]/g, "");

    if (!reminderMessage) {
        return false;
    }

    var reminderTime = moment(parsedDate.start.date());

    if (!reminderTime.isValid() || reminderTime <= new Date()) {
        return false;
    }

    return true;
}

/**
 * Use this function to get the reminder message from a valid reminder string
 *
 * @param {String} reminderString the string to validate. Must contain a message and time.
 * @returns {{message: String, date: Date}}  the message and date that should be used for the reminder.
 */
module.exports.getMessageAndDateFromReminderString = (reminderString) => {

    if (!this.validateReminderString(reminderString)) {
        throw new Error("Invalid reminder string!");
    }

    var parsedDate = chrono.parse(reminderString, new Date(), { forwardDate: true })[0];

    var message = reminderString.replace(parsedDate.text, "").trim();

    var date = parsedDate.start.date();

    return { message: message, date: date };
}

module.exports.validSnoozeString = (snoozeString) => {

    let result = humanInterval(snoozeString);

    if (isNaN(result)) {
        return false;
    }

    return true;
}

module.exports.getMillisecondsFromSnoozeString = (snoozeString) => {

    if (!this.validSnoozeString(snoozeString)) {
        throw new Error("Invalid snooze string!");
    }

    return humanInterval(snoozeString);
}
