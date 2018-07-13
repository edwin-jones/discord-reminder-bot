//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('parser');
const chrono = require('chrono-node');
const moment = require('moment');

//we use these regexes to repeatedly find the words 'until' and 'for' in a string
//only when they are NOT part of other words
const untilRegex = new RegExp("\\b" + "until" + "\\b");
const forRegex = new RegExp("\\b" + "for" + "\\b");

//This function uses the above regexes to replace words in our snooze string
//so it will work better with chrono-node
const cleanSnoozeString = (snoozeString) => {
    snoozeString = snoozeString.replace(untilRegex, "at");
    snoozeString = snoozeString.replace(forRegex, "in");

    return snoozeString;
}

/**
 * Use this function to check to see if a reminder string is valid
 *
 * @param {string} reminderString the string to validate. Must contain a message and time.
 * @returns {boolean} a boolean value representing if the reminder string is valid or not.
 */
module.exports.validReminderString = (reminderString) => {

    let parsedDate = chrono.parse(reminderString, new Date(), { forwardDate: true })[0];

    if (parsedDate == undefined) {
        return false;
    }

    //remove whitespace from message
    let reminderMessage = reminderString.replace(parsedDate.text, "").trim();

    //remove all unprintable chars from message (ASCII 32-127 ONLY)
    reminderMessage = reminderMessage.replace(/[^\x20-\x7F]/g, "");

    if (!reminderMessage) {
        return false;
    }

    let reminderTime = moment(parsedDate.start.date());

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

    if (!this.validReminderString(reminderString)) {
        throw new Error("Invalid reminder string!");
    }

    let parsedDate = chrono.parse(reminderString, new Date(), { forwardDate: true })[0];

    let message = reminderString.replace(parsedDate.text, "").trim();

    let date = parsedDate.start.date();

    return { message: message, date: date };
}

/**
 * Use this function to check to see if a snooze string is valid
 *
 * @param {string} snoozeString the string to validate. Must contain a time.
 * @returns {boolean} a boolean value representing if the snooze string is valid or not.
 */
module.exports.validSnoozeString = (snoozeString) => {

    snoozeString = cleanSnoozeString(snoozeString);

    let parsedDate = chrono.parse(snoozeString, new Date(), { forwardDate: true })[0];

    if (parsedDate == undefined) {
        return false;
    }

    let snoozeUntilTime = moment(parsedDate.start.date());

    if (!snoozeUntilTime.isValid() || snoozeUntilTime <= new Date()) {
        return false;
    }

    return true;
}

/**
 * Use this function to get the time/date to snooze until from a valid snooze string
 *
 * @param {String} snoozeString the string to parse. Must contain a time.
 * @returns {Date} the date that should be used to snooze the reminder for/until.
 */
module.exports.getDateFromSnoozeString = (snoozeString) => {

    if (!this.validSnoozeString(snoozeString)) {
        throw new Error("Invalid snooze string!");
    }

    let parsedDate = chrono.parse(cleanSnoozeString(snoozeString), new Date(), { forwardDate: true })[0];

    let date = parsedDate.start.date();

    return date;
}
