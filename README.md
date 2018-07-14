# discord-reminder-bot

A simple [Node.js](https://nodejs.org/en/) bot for [Discord](https://discordapp.com/) that sets reminders for individual users, inspired by [slack](https://get.slack.help/hc/en-us/articles/208423427-Set-a-reminder).
Requires a running [MongoDB](https://www.mongodb.com/) server to work. The scheduling system is powered by [Agenda](https://github.com/agenda/agenda).

Ideally you should set an ascending clustered index on `name` + `data.userId`, a descending index on `lastRunAt` and an ascending clustered index index on `name`, + `data.userId` + `nextRunAt` respectively for best performance.

Forked from my other bot for discord, [catbot.](https://github.com/edwin-jones/discord-catbot)
