const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const champions = require('../champions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reportmatch")
        .setDescription("Report a match result")
        .addStringOption(option => 
            option.setName('player1_nickname')
                .setDescription('The nickname of player 1')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => 
            option.setName('player2_nickname')
                .setDescription('The nickname of player 2')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => 
            option.setName('winner_nickname')
                .setDescription('The nickname of the winner')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => 
            option.setName('score')
                .setDescription('The score of the match (optional)'))
        .addBooleanOption(option => 
            option.setName('custom_rules')
                .setDescription('Did the participants play with custom rules approved by staff?')
                .setRequired(false))
        .addBooleanOption(option =>
                option.setName('bo')
                .setDescription('Not final best of round')
                .setRequired(false)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
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

        const [rows] = await connection.execute('SELECT nickname FROM toast WHERE nickname LIKE ?', [`%${focusedValue}%`]);
        await connection.end();

        const choices = rows.map(row => row.nickname);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 24);
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
            }

            const player1Nickname = interaction.options.getString('player1_nickname');
            const player2Nickname = interaction.options.getString('player2_nickname');
            const winnerNickname = interaction.options.getString('winner_nickname');
            const score = interaction.options.getString('score');
            const customRules = interaction.options.getBoolean('custom_rules') || false;
            const bo = interaction.options.getBoolean('bo') || false; 

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

            const [player1] = await connection.execute('SELECT id, otp, CAST(discord_id AS CHAR) AS discord_id FROM toast WHERE nickname = ?', [player1Nickname]);
            const [player2] = await connection.execute('SELECT id, otp, CAST(discord_id AS CHAR) AS discord_id FROM toast WHERE nickname = ?', [player2Nickname]);
            const [winner] = await connection.execute('SELECT id, otp, CAST(discord_id AS CHAR) AS discord_id FROM toast WHERE nickname = ?', [winnerNickname]);

            if (player1.length === 0 || player2.length === 0 || winner.length === 0) {
                throw new Error(`One or more players do not exist`);
            }

            const player1Data = player1[0];
            const player2Data = player2[0];
            const winnerData = winner[0];
            let loserData;

            await connection.execute(
                'INSERT INTO matches (player1_id, player2_id, winner_id, date) VALUES (?, ?, ?, ?)',
                [player1Data.id, player2Data.id, winnerData.id, new Date()]
            );

            if (winnerData.id === player1Data.id) {
                await connection.execute('UPDATE toast SET wins = wins + 1 WHERE id = ?', [player1Data.id]);
                if (!bo) {
                    await connection.execute('UPDATE toast SET eliminated = TRUE WHERE id = ?', [player2Data.id]);
                }
                loserData = player2Data;
            } else if (winnerData.id === player2Data.id) {
                await connection.execute('UPDATE toast SET wins = wins + 1 WHERE id = ?', [player2Data.id]);
                if (!bo) {
                    await connection.execute('UPDATE toast SET eliminated = TRUE WHERE id = ?', [player1Data.id]);
                }
                loserData = player1Data;
            } else {
                throw new Error('Winner ID does not match any player ID');
            }


            await connection.end();

            const matchEmbed = new EmbedBuilder()
                .setTitle(':star: Match Result')
                .setDescription(`Congratulations to ${champions[winnerData.otp] ? `<:${winnerData.otp}:${champions[winnerData.otp]}>` : ''} <@${winnerData.discord_id}> \nfor winning the match against ${champions[loserData.otp] ? `<:${loserData.otp}:${champions[loserData.otp]}>` : ''} <@${loserData.discord_id}> \n‎ `)
                .setColor('#FFD700')
                .setThumbnail('attachment://victory.png');

            if (score) {
                const [score1, score2] = score.split(':').map(Number);
                const scoreMessage = score1 > score2 
                    ? `The score is now **${score1}:${score2}** for <@${player1Data.discord_id}>.` 
                    : `The score is now **${score2}:${score1}** for <@${player2Data.discord_id}>.`;
                matchEmbed.addFields({ name: ':medal: Score', value: scoreMessage });
            }

            if (customRules) {
                matchEmbed.addFields({ name: '<:custom:1353511809474105415> Custom Rules', value: 'This match was played with custom rules approved by staff.' });
            }

            await interaction.reply({ content: 'Match result has been reported.', flags: 64 });
            await interaction.channel.send({ embeds: [matchEmbed], files: [{ attachment: path.join(__dirname, '../victory.png'), name: 'victory.png' }] });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
}
