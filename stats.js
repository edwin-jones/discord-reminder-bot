//dependencies
const log = require('debug')('stats');
const client = require('mongodb').MongoClient;
const StringBuilder = require('string-builder');

const auth = require('./auth.json'); //you need to make this file yourself!

const dbName = 'catbot';
const collectionName = 'catstats';


//Use this function to incremement a stat
exports.incrementStat = (name) => {

    client.connect(auth.mongourl, function(err, client) {
    
        if (err)
        {
            log("failed to connect to mongodb: " + err);
            return;
        }

        log("connected to mongodb");
        
        let database = client.db(dbName);
        let catstats = database.collection(collectionName);

        catstats.update(
            { name: name },
            { $inc: { count: 1 } }
        )
    
        client.close();

        log(`incremented stat ${name} successfully`);

  });  
}


//use this function to print stats
exports.printStats = (bot, channelID) => {

    client.connect(auth.mongourl, function(err, client) {
    
        if (err)
        {
            log("failed to connect to mongodb: " + err);
            return;
        }

        log("connected to mongodb");
        
        let database = client.db(dbName);
        let catstats = database.collection(collectionName);

        var sb = new StringBuilder();
        catstats.find({}).toArray(function(err, result) {

            if (err)
            {
                log("failed to find documents: " + err);
                return;
            }

            sb.appendLine("So far I have:")

            for(var i in result)
            {
                sb.appendLine(`\t${result[i].prefix} **${result[i].count}** ${result[i].suffix}`);  
            }

            bot.sendMessage(
                {
                    to: channelID,
                    message: sb.toString()
                });
            
          });

        client.close();
    });  
}