const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const champions = require('../champions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createbracket")
        .setDescription("Create a tournament bracket")
        .addIntegerOption(option => 
            option.setName('wins')
                .setDescription('Minimum number of wins to include players')
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName('bo3')
                .setDescription('Best of 3 | Round 4 & 5 (3 or 5 wins)')
                .setRequired(false))
        .addBooleanOption(option => 
            option.setName('bo5')
                .setDescription('Best of 5 | Round 6 (7 wins)')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
            }

            const wins = interaction.options.getInteger('wins') || 0;
            const bo3 = interaction.options.getBoolean('bo3') || false;
            const bo5 = interaction.options.getBoolean('bo5') || false;
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

            const query = 'SELECT id, CAST(discord_id AS CHAR) AS discord_id, nickname, server, otp FROM toast WHERE wins >= ? AND eliminated = FALSE';
            const [rows] = await connection.execute(query, [wins]);

            const serverCounts = {};
            const multiServerPlayers = [];
            const playerData = [];

            rows.forEach(player => {
                const servers = player.server.split(',').map(s => s.trim());
                if (servers.length > 1) {
                    multiServerPlayers.push({
                        discord_id: player.discord_id,
                        nickname: player.nickname,
                        servers: servers,
                        otp: player.otp
                    });
                } else {
                    const server = servers[0];
                    if (!serverCounts[server]) serverCounts[server] = 0;
                    serverCounts[server]++;
                    playerData.push({ ...player, server });
                }
            });

            multiServerPlayers.forEach(player => {
                let bestServer = player.servers[0];
                let bestBalance = Infinity;

                player.servers.forEach(server => {
                    const newBalance = Math.abs((serverCounts[server] + 1) % 2);
                    if (newBalance < bestBalance) {
                        bestBalance = newBalance;
                        bestServer = server;
                    }
                });

                if (!serverCounts[bestServer]) serverCounts[bestServer] = 0;
                serverCounts[bestServer]++;
                playerData.push({ ...player, server: bestServer });
            });

            playerData.sort(() => Math.random() - 0.5);

            const pairs = [];
            const usedPlayers = new Set();

            for (let i = 0; i < playerData.length; i++) {
                const player1 = playerData[i];
                if (usedPlayers.has(player1.discord_id)) continue;

                for (let j = i + 1; j < playerData.length; j++) {
                    const player2 = playerData[j];
                    if (usedPlayers.has(player2.discord_id) || player1.otp === player2.otp || player1.server !== player2.server) continue;
                    
                    pairs.push([player1, player2]);
                    usedPlayers.add(player1.discord_id);
                    usedPlayers.add(player2.discord_id);
                    break;
                }
            }

            const loadingEmbed = new EmbedBuilder()
                .setDescription('Please wait while the bracket is being created.')
                .setImage('attachment://toast_loading.gif')
                .setColor(0x2a8cfd);

            const message = await interaction.channel.send({ embeds: [loadingEmbed], files: [{ attachment: path.join(__dirname, '../toast_loading.gif'), name: 'toast_loading.gif' }] });
            await interaction.reply({ content: 'Bracket creation has been initiated.', flags: 64 });

            setTimeout(async () => {
                let bannerImage = 'attachment://toast_banner.png';
                let files = [{ attachment: path.join(__dirname, '../toast_banner.png'), name: 'toast_banner.png' }];
                if (bo3 && (wins === 3 || wins === 5)) {
                    bannerImage = 'attachment://toast_banner_bo3.png';
                    files = [{ attachment: path.join(__dirname, '../toast_banner_bo3.png'), name: 'toast_banner_bo3.png' }];
                } else if (bo5 && wins === 7) {
                    bannerImage = 'attachment://toast_banner_bo5.png';
                    files = [{ attachment: path.join(__dirname, '../toast_banner_bo5.png'), name: 'toast_banner_bo5.png' }];
                }

                const rounds = wins === 7 ? wins - 1 : wins === 5 ? wins : wins + 1;
                const embed = new EmbedBuilder()
                    .setTitle(`Tournament Bracket | Round ${rounds}`)
                    .setColor(0xff5601)
                    .setImage(bannerImage)
                    .setFooter({ text: 'Good luck to all participants! | TOAST Bot by timfernix', iconURL: 'https://cdn.discordapp.com/avatars/589773984447463434/6fc6c6f574cf15e8a51258dea37e13b4.png?size=1024' });

                let fieldContent = '';
                pairs.forEach((pair, index) => {
                    const player1Emote = champions[pair[0].otp] ? `<:${pair[0].otp}:${champions[pair[0].otp]}>` : '';
                    const player2Emote = champions[pair[1].otp] ? `<:${pair[1].otp}:${champions[pair[1].otp]}>` : '';
                    fieldContent += `<@${pair[0].discord_id}> ${player1Emote} <:vs:1353038925110710403> ${player2Emote} <@${pair[1].discord_id}>\n`;
                    if ((index + 1) % 4 === 0 || index === pairs.length - 1) {
                        embed.addFields({ name: `Matches ${Math.floor(index / 4) * 4 + 1}-${Math.min((Math.floor(index / 4) + 1) * 4, pairs.length)}`, value: fieldContent });
                        fieldContent = '';
                    }
                });

                if (bo3 && wins === 3) {
                    embed.addFields({ name: '**Best of 3**', value: 'This is a best of 3 match against the named player.\nEach round must still be reported.' });
                }

                if (bo5 && wins === 5) {
                    embed.addFields({ name: '**Best of 5**', value: 'This is a best of 5 match against the named player.\nEach round must still be reported.' });
                }

                const unpairedPlayers = playerData.filter(player => !usedPlayers.has(player.discord_id));

                if (unpairedPlayers.length > 0) {
                    const unpairedEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('Not paired players:');

                    unpairedPlayers.forEach(player => {
                        unpairedEmbed.addFields({ 
                            name: player.nickname, 
                            value: `<@${player.discord_id}> (${player.otp})`,
                        });
                    });

                    await message.edit({ embeds: [embed, unpairedEmbed], files });
                } else {
                    await message.edit({ embeds: [embed], files });
                }

            }, 3000);

            await connection.end();
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
}
