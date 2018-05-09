// Written by Edwin Jones - http://edwinjones.me.uk
// Documentation and Discord.js integration by Jason Browne - https://jbrowne.io

'use strict';

//dependencies
const log = require('debug')('stats');
const client = require('mongodb').MongoClient;
const StringBuilder = require('string-builder');

const auth = require('./auth.json'); //you need to make this file yourself!

const dbName = 'catbot';
const collectionName = 'catstats';


/**
 * Use this function to incremement a stat
 *
 * @param name the stat to increment
 * @returns a Promise that resolves on success, or rejects on failure
 */
exports.incrementStat = (name) => {

    return new Promise((resolve, reject) => {

        client.connect(auth.mongourl, function (err, client) {

            try {

                if (err) {

                    throw err;
                }

                log("connected to mongodb");

                let database = client.db(dbName);
                let catstats = database.collection(collectionName);

                catstats.updateOne(
                    { name: name },
                    { $inc: { count: 1 } }
                );

                log(`incremented stat ${name} successfully`);
                resolve();
            }
            catch (err) {

                log(err);
                reject(err);
            }
            finally {

                log("disconnected from mongodb");
                client.close();
            }
        });
    });
}

/**
 * Use this function to get stats
 *
 * @returns a promise of a string (to send to chat)
 */
exports.getStats = () => {

    return new Promise((resolve, reject) => {

        client.connect(auth.mongourl, function (err, client) {

            try {

                if (err) {

                    throw err;
                }

                log("connected to mongodb");

                let database = client.db(dbName);
                let catstats = database.collection(collectionName);

                var sb = new StringBuilder();

                catstats.find({}).toArray(function (err, result) {

                    if (err) {

                        log(err);
                        reject(err);
                        return;
                    }

                    sb.appendLine("So far I have:")

                    for (var i in result) {

                        sb.appendLine(`\t${result[i].prefix} **${result[i].count}** ${result[i].suffix}`);
                    }

                    resolve(sb.toString());
                });

            }
            catch (err) {

                log(err);
                reject(err);
            }
            finally {

                log("disconnected from mongodb");
                client.close();
            }
        });
    });
}