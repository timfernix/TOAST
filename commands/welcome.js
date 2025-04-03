const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Send a welcome message to the server'),
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
        .setTitle('Welcome!')
        .setDescription(`Hello everyone! Welcome to TOAST!\n\nHere we host Twodis OTP ARAM Super Tournament (long for TOAST). To get started, please register with Zoe using the </register:864483338902175755> command, fill out the details, and follow the steps to verify your account.\nIf you have access to an account in a region other than your main one and can use it during the tournament, please add it with </add account:864483340492734474> after.\n\nPlease make sure to read the rules in https://discord.com/channels/1352991968933974048/1353166474935668909.`)
        .setColor(0x00ff00)
        .setImage('https://cdn.discordapp.com/banners/1352990271125590106/a_e921dd7315624f08833b9141dac592fc.gif?size=1024'); 

      await interaction.reply({
        content: 'Welcome message sent!',
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
