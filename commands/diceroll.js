const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diceroll')
        .setDescription('Roll two dice'),
    async execute(interaction) {
        try {
            const user = interaction.user;

            const rollingEmbed = new EmbedBuilder()
                .setTitle(':game_die: Dice Roll')
                .setDescription(`*Rolling dices...*`)
                .setColor('#00FF00');

            await interaction.reply({ embeds: [rollingEmbed] });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const rollDice = () => Math.floor(Math.random() * 6) + 1;
            const dice1 = rollDice();
            const dice2 = rollDice();
            const total = dice1 + dice2;

            const diceRollEmbed = new EmbedBuilder()
                .setTitle(':game_die: Dice Roll')
                .setDescription(`${user} rolled a **${dice1}** and a **${dice2}**.\n**Total: ${total}**`)
                .setColor('#00FF00');

            await interaction.editReply({ embeds: [diceRollEmbed] });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.editReply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
};
