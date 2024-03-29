const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId } = require('./config.json');
const token = "OTA2NTg4NzI0NDA0NTU1Nzk2.YYa0iw.trlqK7S00ExSWyKqud9T-LPYbCA";

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}
const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);



//new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
//    new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
//    new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
 //   new SlashCommandBuilder().setName('latency').setDescription('Replies with latency!')