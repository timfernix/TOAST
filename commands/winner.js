const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const champions = require('../champions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('winner')
        .setDescription('Send the winner embed to the channel')
        .addStringOption(option => 
            option.setName('nickname')
                .setDescription('The nickname of the winner')
                .setRequired(true)
                .setAutocomplete(true)),
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

            const nickname = interaction.options.getString('nickname');
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

            const [rows] = await connection.execute('SELECT CAST(discord_id AS CHAR) AS discord_id, otp FROM toast WHERE nickname = ?', [nickname]);
            await connection.end();

            if (rows.length === 0) {
                return interaction.reply({ content: `No user found with nickname ${nickname}`, flags: 64 });
            }

            const discord_id = rows[0].discord_id;
            const otp = rows[0].otp;
            const emoji = champions[otp] || '';

            await interaction.reply({ content: 'Sending winner embed...', flags: 64 });

            const winnerEmbed = new EmbedBuilder()
                .setTitle(':crown: TOAST Winner')
                .setDescription(`Congratulations to <@${discord_id}> for winning our first TOAST,\n on their OTP <:${otp}:${emoji}> **${otp}**! :tada:`)
                .setColor('#FFD700')
                .setImage('attachment://toast_banner_win.png');

            await interaction.channel.send({ embeds: [winnerEmbed], files: [{ attachment: path.join(__dirname, '../toast_banner_win.png'), name: 'toast_banner_win.png' }] });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
};
