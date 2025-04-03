const { SlashCommandBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const champions = require('../champions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("listplayers")
        .setDescription("List all players with their IDs and nicknames"),
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496'; 
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: 64,
                });
            }

            const caCertPath = path.join(__dirname, '../ca.pem');
            const caCert = fs.readFileSync(caCertPath);

            const connection = await mysql.createConnection({
                host: '',
                port: ,
                user: '',
                password: '',
                database: '',
                ssl: {
                    ca: caCert
                }
            });

            const [rows] = await connection.execute('SELECT id, nickname, otp, server, riot_id, eliminated FROM toast');
            await connection.end();

            const playerCount = rows.length;
            const now = new Date();
            const timestamp = `<t:${Math.floor(now.getTime() / 1000)}:F> (<t:${Math.floor(now.getTime() / 1000)}:R>)`;

            const serverGroups = {};
            const multipleServers = [];

            rows.forEach((row) => {
                const servers = row.server.split(',');
                const riotIds = row.riot_id.split(',');
                const otpEmote = champions[row.otp] ? `<:${row.otp}:${champions[row.otp]}>` : '';
                let playerInfo = `${otpEmote} **${row.nickname}** - ${riotIds.join(', ')} (${servers.join(', ')})\n`;

                if (row.eliminated) {
                    playerInfo = `~~${playerInfo}~~`;
                }

                if (servers.length > 1) {
                    multipleServers.push(playerInfo);
                } else {
                    const server = servers[0];
                    if (!serverGroups[server]) {
                        serverGroups[server] = [];
                    }
                    serverGroups[server].push(playerInfo);
                }
            });

            let messageContent = `# <:vs:1353038925110710403> __TOAST - Player List__\n\n**Status as of** ${timestamp}\n\n**Total Players: ${playerCount}**\n\n`;
            let messages = [messageContent];

            Object.keys(serverGroups).forEach((server) => {
                let serverHeader = `**${server}**\n`;
                if (messages[messages.length - 1].length + serverHeader.length > 2000) {
                    messages.push('');
                }
                messages[messages.length - 1] += serverHeader;
                serverGroups[server].forEach((playerInfo) => {
                    if (messages[messages.length - 1].length + playerInfo.length > 2000) {
                        messages.push('');
                    }
                    messages[messages.length - 1] += playerInfo;
                });
                messages[messages.length - 1] += '\n';
            });

            if (multipleServers.length > 0) {
                let multipleServersHeader = `**Multiple Servers**\n`;
                if (messages[messages.length - 1].length + multipleServersHeader.length > 2000) {
                    messages.push('');
                }
                messages[messages.length - 1] += multipleServersHeader;
                multipleServers.forEach((playerInfo) => {
                    if (messages[messages.length - 1].length + playerInfo.length > 2000) {
                        messages.push('');
                    }
                    messages[messages.length - 1] += playerInfo;
                });
            }

            for (const message of messages) {
                await interaction.channel.send(message);
            }

            await interaction.reply({ content: 'Player list has been posted.', flags: 64 });

            const updateChannel = await interaction.client.channels.fetch('1352991970007449652');
            await updateChannel.send('Playerlist has been updated');
        } catch (error) {
            console.error('Error executing the command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: 64 });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: 64 });
            }
        }
    }
}
