//Written by Edwin Jones - http://edwinjones.me.uk

'use strict';

const log = require('debug')('parser');
const chrono  = require('chrono-node');
const moment = require('moment');

/**
 * Use this function to check to see if a reminder string is valid
 *
 * @param {string} reminderString the string to validate. Must contain a message and time.
 * @returns {boolean} a boolean value representing if the reminder is valid or not.
 */
module.exports.validateReminderString = (reminderString) => {

    var parsedDate = chrono.parse(reminderString, new Date(), {forwardDate: true})[0];

    if(parsedDate == undefined)
    {
        return false;
    }

    var reminderMessage = reminderString.replace(parsedDate.text, "").trim();

    if(!reminderMessage)
    {
        return false;
    }

    var reminderTime = parsedDate.start.date();

    if(reminderTime <= new Date())
    {
        return false;
    }

    return true;
}

/**
 * Use this function to get the reminder message from a valid reminder string
 *
 * @param {String} reminderString the string to validate. Must contain a message and time.
 * @returns {{message: String, date}}  the message and date that should be used for the reminder. Date is a moment object.
 */
module.exports.getMessageAndDateFromReminderString = (reminderString) => {

    if(!this.validateReminderString(reminderString))
    {
        throw new Error("Invalid reminder string!");
    }

    var parsedDate = chrono.parse(reminderString, new Date(), {forwardDate: true})[0];

    var message = reminderString.replace(parsedDate.text, "").trim();

    var date = moment(parsedDate.start.date());

    return { message: message, date: date };
}