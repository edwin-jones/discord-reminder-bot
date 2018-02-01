//full source for the tutorial this bot is based on is available here: https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0
//written by Edwin Jones - http://edwinjones.me.uk

//dependencies
const discord = require('discord.io');
const log = require('debug')('catbot')
const request = require('request');

const apiToken = process.env.DISCORD_API_TOKEN || "NOT_SET";

function onError(bot, channelID) {
    bot.sendMessage(
        {
            to: channelID,
            message: "Sorry, I'm catnapping now. Please ask me later."
        });
}

//Use this function to post a cat fact into the relevant discord channel via the bot object.
function getCatFact(bot, channelID) {
    request('https://polite-catfacts.herokuapp.com/catfact', { json: true }, (err, res, body) => {
        if (err) {
            onError(bot, channelID);
            return;
        }

        bot.sendMessage(
            {
                to: channelID,
                message: body.fact
            });

        log("catfact command completed");
    });
}

//use this function to get cat pictures and post them in discord
function getCatPic(bot, channelID, userID) {
    request('http://thecatapi.com/api/images/get?format=src', (err, res, body) => {
        if (err) {
            onError(bot, channelID);
            return;
        }

        bot.sendMessage({
            to: channelID,
            embed:
                {
                    color: 4954687, //RGB value cast from hex to int. This is green!
                    image:
                        {
                            url: res.request.href
                        }
                }
        });

        log("catpic command completed");
    });

}

// Initialize Discord Bot
var bot = new discord.Client(
    {
        token: apiToken,
        autorun: true
    });

//log when the bot is ready
bot.on('ready', function (evt) {
    log('Connected');
    log('Logged in as: ');
    log(bot.username + ' - (' + bot.id + ')');
});

//handle disconnects by auto reconnecting
bot.on('disconnect', function (erMsg, code) {
    log(`----- Bot disconnected from Discord with code ${code} for reason: ${erMsg} -----`);
    bot.connect();
})

//log when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', function (user, userID, channelID, message, evt) {
    // catbot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        log("recieved a command!")

        let args = message.substring(1).split(' ');
        let cmd = args[0];
        args = args.splice(1);

        switch (cmd) {
            // handle commands
            case 'help':
                bot.sendMessage(
                    {
                        to: channelID,
                        message: "you can ask me for a random cat fact with **!catfact**, picture with **!catpic** or you can stroke me with **!stroke** - I do love to be stroked **:3**"
                    });

                log("help command executed");
                break;

            case 'catfact':
                getCatFact(bot, channelID);
                log("catfact command executed");
                break;

            case 'catpic':
                getCatPic(bot, channelID);
                log("catpic command executed");
                break;

            case 'stroke':
                bot.sendMessage(
                    {
                        to: channelID,
                        message: "**puuurrrrrrrrrr!** Thank you <@" + userID + "> **:3**"
                    });

                log("stroke command executed");
                break;
        }
    }
});