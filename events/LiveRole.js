const dayjs = require("dayjs");
const {nowLiveRoleID} = require('../guild.json');

module.exports = {
    name: 'presenceUpdate',
    async execute(oldMember, newMember) {
        let status = newMember.activities;
        let user = newMember.member;
        let guild = user.guild
        let userRoles = user._roles;
        let allActivities = status.toString();

        if (allActivities.includes("Twitch") || allActivities.includes("YouTube")) {
            if (!userRoles.includes(nowLiveRoleID)) {
                return await giveRole(newMember, user, nowLiveRoleID, guild);
            }

        } else {
            if (userRoles.includes(nowLiveRoleID)) {
                return await removeRole(newMember, user, nowLiveRoleID, guild);
            }
        }
    // function to giveRole live to user
    async function giveRole(activity, user, roleID, guild) {
        // cache get if you have an ID of the role
        let role = guild.roles.cache.get(roleID)
        user.roles.add(role);
        console.log(`${dayjs()}: ${user.displayName} has been detected as streaming. ${role.name} role has been given.`);
    }
    // function to removeRole live to user
    async function removeRole(activity, user, roleID, guild) {
        // cache get if you have an ID of the role
        let role = guild.roles.cache.get(roleID)
        user.roles.remove(role);
        console.log(`${dayjs()}: ${user.displayName} has not been detected as streaming. ${role.name} role has been removed.`);
    }
    },
};