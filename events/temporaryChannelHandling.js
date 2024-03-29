/*
*   Event handler to detect if user has joined a creation channel, and if so, create a temporary channel and move them
*   there. The channel will take properties from the parameter within the pool.
*/
const dayjs = require("dayjs");

const { pool } = require("../db");
const { MessageEmbed } = require("discord.js");
const function_name = "RapidShard | Temporary Channel"
const version = 0.2;

module.exports = {
    name: 'voiceStateUpdate',

    async execute(oldState, newState) {
        // call get state
        // let states = await getState(oldState, newState);
        const memberInChannelId = newState.channelId;
        const memberOutChannelId = oldState.channelId;
        const guild = oldState.guild;
        const member = newState.member;

        // call checker function for joining
        if (await channelConnectCheck(memberInChannelId, member, guild)){
            console.log(`${dayjs()}: ${member.displayName}'s room created.`)
        } else {
            // channel leave checker
            if (await channelDisconnectCheck(memberOutChannelId, member, guild)){
            }
        }


    }

};

// checker function that confirms if user is in creation channel or has left a channel
async function channelConnectCheck(memberInChannelId, member, guild) {
    try {
        pool.query(`SELECT *
                    FROM "temporaryChannelProperties"
                    WHERE "guildID" = $1`, [guild.id,], async function (err, result, fields) {
            if (err) throw err;
            const creationChannelID = result.rows[0].creationChannelID;
            if (creationChannelID === memberInChannelId) {
                console.log(`${dayjs()}: ${member.displayName} has joined a creation channel, creating temp channel.`);
                const voiceCategoryID = result.rows[0].voiceCategoryID;
                const textCategoryID = result.rows[0].textCategoryID;
                const bitrate = result.rows[0].channelBitrate;
                const userLimit = result.rows[0].channelUserLimit;
                return await createChannels(voiceCategoryID, textCategoryID, bitrate, userLimit, member, guild);
            }
        });
    } catch {

    }

}

// create temporary channel: voice and text
async function createChannels(voiceCategoryID, textCategoryID, bitrate, userLimit, member, guild){
    // fetch parameters
    let voiceCategory = await guild.channels.fetch(voiceCategoryID);
    let textCategory = await guild.channels.fetch(textCategoryID);
    // create the channels
    let voiceChannel = await voiceCategory.createChannel(`${member.displayName}'s room`, {type: "GUILD_VOICE", bitrate: `${bitrate}`});
    await member.voice.setChannel(voiceChannel);
    let textChannel = await textCategory.createChannel(`${member.displayName}'s room`, {type: "GUILD_TEXT", position: 3});
    //embed
    const startEmbed = new MessageEmbed()
        .setColor("#3288de")
        .setTitle(`${member.displayName}'s Room`)
        .setDescription(`<:ok:865288784618717207> <@${member.id}> this is your temporary text channel, when your temporary voice channel is empty and gets deleted, this will also be deleted.\n\nFind out all features of temporary channel:`
            + "```/channel commands```")
        .setFooter(`${function_name} ${version}`);
    await textChannel.send({embeds: [startEmbed]});
    let sql = `INSERT INTO "temporaryChannelLive" ("guildId", "voiceChannelId", "textChannelId", "ownerId", "renameLimiter", "lockedChannelRoleId") VALUES (${guild.id}, ${voiceChannel.id}, ${textChannel.id}, ${member.id}, 0, 0)`;
    pool.query(sql, function(err, result) {
        if (err) throw err;
    });

}

// function to check if user has left and if so, delete channel
async function channelDisconnectCheck(memberOutChannelId, member, guild){
    // pool connection
    pool.query(`SELECT * FROM "temporaryChannelLive"`, async function (err, result, fields) {
        if (err) throw err;

        for (let i = 0; i < result.rows.length; i++) {

            if (result.rows[i].guildId === guild.id && result.rows[i].voiceChannelId === memberOutChannelId) {
                const voiceChannelId = result.rows[i].voiceChannelId;
                const textChannelId = result.rows[i].textChannelId;
                const lockedChannelRoleId = result.rows[i].lockedChannelRoleId;

                let voiceChannel = await guild.channels.fetch(voiceChannelId)
                    .then(channel => {
                    return channel;
                    }).catch(console.error);

                let textChannel = await guild.channels.fetch(textChannelId)
                    .then(channel => {
                        return channel;
                    }).catch(console.error);

                let memberSize = voiceChannel.members.size;

                // check if size
                if (memberSize === 0) {
                    if(await channelsDelete(voiceChannel, textChannel, guild, lockedChannelRoleId)){}

                    pool.query(`DELETE FROM "temporaryChannelLive" WHERE "voiceChannelId" = $1`, [memberOutChannelId,]);
                    console.log(`${dayjs()}: ${member.displayName}'s room deleted.`);

                    return true;
                }
            }
        }
        return false;
    });
}

// function to delete voice channel and text channel if it is empty.
async function channelsDelete(voiceChannel, textChannel, guild, lockedChannelRoleId){
    try {
        await voiceChannel.delete();
    } catch {
        console.error("Couldn't delete voiceChannel.")
    }

    try {
        await textChannel.delete();
    } catch {
        console.error("Couldn't delete textChannel.")
    }
    try {
        let role = guild.roles.cache.get(lockedChannelRoleId);
        await role.delete();
    }catch {}
    return true;
}
