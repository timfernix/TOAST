const { SlashCommandBuilder } = require("discord.js");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deleteplayer")
        .setDescription("Delete a player by their ID")
        .addIntegerOption(option => 
            option.setName('id')
                .setDescription('The ID of the player to delete')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
            }

            const playerId = interaction.options.getInteger('id');
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
                'DELETE FROM toast WHERE id = ?',
                [playerId]
            );

            await connection.end();

            await interaction.reply({ content: `Player with ID ${playerId} has been deleted.`, flags: 64 });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', flags: 64 });
        }
    }
}
