const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'profile',
			description: 'See and flex your profile.',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		await interaction.defer();

		const data = await this.client.userDatabase.db_fetch({ id: interaction.user.id });
		const avatarURL = interaction.user.avatarURL('png');
		console.log(data);
		return interaction.createFollowup({ embeds: [{
			author: { name: interaction.user.tag, iconURL: avatarURL },
			color: this.client.utils.randomHex(),
			fields: [
				{ name: '🎲 Games played', value: data.games.toLocaleString() },
				{ name: '🎭 Wins as None', value: data.none_wins.toLocaleString(), inline: true },
				{ name: '👩‍🌾 Wins as Town', value: data.town_wins.toLocaleString(), inline: true },
				{ name: '🤵 Wins as Mafia', value: data.mafia_wins.toLocaleString(), inline: true },
			],
			thumbnail: { url: avatarURL },
			footer: { text: 'Hoodlum, made by Face#0981' },
		}] });
	}
};