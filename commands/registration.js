const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registration')
    .setDescription('Sends the registration message to the server'),
  async execute(interaction) {
    try {
      const requiredRoleId = '1352993514996371496'; 
      if (!interaction.member.roles.cache.has(requiredRoleId)) {
        return interaction.reply({
          content: 'You do not have permission to use this command.',
          flags: 64,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('Please verify your League of Legends account!')
        .setDescription(`Please register with Zoe using the </register:864483338902175755> command, fill out the details, and follow the steps to verify your account.\nIf you have access to an account in a region other than your main one and can use it during the tournament, please add it with </add account:864483340492734474> after.\n\n If you need help with the process click [here](https://wiki.zoe-discord-bot.ch/en/Guides/RegisterWithVerification).`)
        .setColor(0x00ff00)
        .setThumbnail('https://cdn.discordapp.com/avatars/550737379460382752/54e9e291b52b931419c4980a06548bca.png?size=1024')

      await interaction.reply({
        content: 'Registration message sent!',
        flags: 64,
      });

      await interaction.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing the welcome command:', error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        flags: 64,
      });
    }
  },
};
