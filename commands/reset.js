const { SlashCommandBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Reset all players' wins and elimination status, and delete all matches"),
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
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

            await connection.execute('UPDATE toast SET wins = 0, eliminated = FALSE');
            await connection.execute('DELETE FROM matches');
            await connection.end();

            await interaction.reply(`All players' wins and elimination status have been reset, and all matches have been deleted.`);
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
}
