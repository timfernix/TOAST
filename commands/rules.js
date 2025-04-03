const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Show the rules for ARAM 1v1"),
    async execute(interaction) {
        try {
            const requiredRoleId = '1352993514996371496';
            if (!interaction.member.roles.cache.has(requiredRoleId)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
            }

            const rulesEmbed = new EmbedBuilder()
                .setTitle("TOAST Rules")
                .setDescription("*Here are the rules for this TOAST tournament.\n Breaking any of these rules will result in disqualification.*")
                .setThumbnail('attachment://spellbook.png')
                .addFields(
                    { name: "<:aram:1353133817153454120> __Map__", value: "The games take place on Howling Abyss (ARAM)" },
                    { name: "<:champion:1353133731313094717> __Champion Selection__", value: "You can only pick your previously clarified champion" },
                    { name: "<:item:1353133560172904531> __Items__", value: "You can buy any combination at game start valued 1300 or lower \n (Guardian items are allowed)" },
                    { name: "<:runes:1353134186030170142> __Runes__", value: "You are free to use any runes of your choice" },
                    { name: "<:spell:1353137177801920595> __Summoner Spells__", value: "All summoner spells are allowed except Exhaust \n(<:Flash:1353127659240034466><:Heal:1353127660519424131> would be one example)" },
                    { name: "<:spectate:1353137533789409462> __Spectators__", value: "Are allowed, but must remain in the fountain and cannot pick champions that influence the game (e.g. soaking XP or applying any buffs/debuffs)" },
                    { name: "<:disconncted:1353139088139489310> __Disconnections__", value: "If a player disconnects, the game will be paused until they return. If they do not return within 5 minutes, they will forfeit the game" },
                    { name: ":satellite: __Reporting__", value: "After the game, the winner must report the result in the https://discord.com/channels/1352991968933974048/1353124835064283156 channel" },
                    { name: ":information: __Custom Rules__", value: "If you and your opponent agree on any custom rules, they must be established before the game starts. Additionally, a <@&1352993514996371496> member must be informed and approve the changes beforehand" },         
                    { name: ":medal: __Format__", value: "Rounds one to three are best of one, quad- and semi-finals are best of three and the final is best of five" },
                    { name: ":crown: __Win Conditions__", value: "<:firstblood:1353121586076713081> First blood the enemy (executing means you lose)\n<:cs:1353121576480018453> Get to 100 CS first\n<:tower:1353126462261301328> Destroy the enemy tower first" }
                )
                .setColor(0x00FF00);

            await interaction.channel.send({ embeds: [rulesEmbed], files: [{attachment: path.join(__dirname, '../spellbook.png'), name: 'spellbook.png'}] });
            await interaction.reply({ content: 'Rules have been posted.', flags: 64 });
        } catch (error) {
            console.error('Error executing the command:', error);
            await interaction.reply({ content: `There was an error while executing this command: ${error.message}`, flags: 64 });
        }
    }
}
