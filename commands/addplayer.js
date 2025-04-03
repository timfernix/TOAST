const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

let champions = [];
const servers = ["BR", "EUNE", "EUW", "LAN", "LAS", "ME", "NA", "OCE", "RU", "TR", "JP", "KR", "SEA", "TW", "VN"];

async function fetchChampions() {
    try {
        const response = await axios.get('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/champion.json');
        const data = response.data.data;
        champions = Object.keys(data).map(key => data[key].id);
    } catch (error) {
        console.error('Error fetching champion names:', error);
    }
}

fetchChampions();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addplayer")
        .setDescription("Add a new player")
        .addStringOption(option => 
            option.setName('discord_id')
                .setDescription('Discord ID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('nickname')
                .setDescription('Nickname')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('riotid')
                .setDescription('Riot ID(s) (comma-separated)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('server')
                .setDescription('Server(s) (comma-separated)')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => 
            option.setName('otp')
                .setDescription('OTP')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;

        if (focusedOption.name === 'otp') {
            const focusedValue = focusedOption.value;
            choices = champions.filter(champion => champion.toLowerCase().startsWith(focusedValue.toLowerCase()));
        } else if (focusedOption.name === 'server') {
            const focusedValue = focusedOption.value;
            choices = servers.filter(server => server.toLowerCase().startsWith(focusedValue.toLowerCase()));
        }

        const limited = choices.slice(0, 25);
        await interaction.respond(
            limited.map(choice => ({ name: choice, value: choice }))
        );
    },
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
            }

            const discordid = interaction.options.getString('discord_id');
            const nickname = interaction.options.getString('nickname');
            const riotid = interaction.options.getString('riotid');
            const server = interaction.options.getString('server');
            const otp = interaction.options.getString('otp');
            const wins = 0;
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

            const [result] = await connection.execute(
                'INSERT INTO toast (discord_id, nickname, riot_id, server, otp, wins) VALUES (?, ?, ?, ?, ?, ?)',
                [discordid, nickname, riotid, server, otp, wins]
            );

            await connection.end();

            const embed = new EmbedBuilder()
                .setTitle('New player added')
                .addFields(
                    { name: 'Discord ID', value: discordid },
                    { name: 'Nickname', value: nickname },
                    { name: 'Riot ID(s)', value: riotid },
                    { name: 'Server(s)', value: server },
                    { name: 'OTP', value: otp }
                )
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', flags: 64 });
        }
    }
};
