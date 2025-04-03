const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("Learn more about the TOAST Bot"),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Yeah so that thing happened...")
      .setAuthor({ name: "timfernix", iconURL: "https://cdn.discordapp.com/avatars/589773984447463434/6fc6c6f574cf15e8a51258dea37e13b4.png?size=1024" })
      .setDescription(
        `It's the 21st of March 2025, Twodi Twodster comes up with the glorious idea of proposing a 1v1 tournament in the [aram lobby chat](https://x.com/Twodi_wav/status/1903185187254546606), apparently he's so out of his mind that he [writes a post](https://x.com/Twodi_wav/status/1903403818462679276) to actually make it happen.
        \nI must be just as crazy, because of course I said I'd help him and that's how this bot was created.
        \n"TOAST Bot" - A javascript bot including a MySQL database in the background, which I started programming for about 12 hours in a row through the night on 23.03. and now...since you're reading this you can probably see what it's doing.\n\nThanks for letting me be part of this project!
        ~Tim <3
        \nFeel free to visit the GitHub Repo here: [TOAST GitHub](https://github.com/timfernix/TOAST)`
      )
      .setColor(0xffffff);

    await interaction.reply({ embeds: [embed] });
  },
};
