const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'help',
			description: 'Get an introduction about me!',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		await interaction.defer();

		interaction.createFollowup({
			embeds: [{
				title: 'Introduction',
				thumbnail: { url: this.client.user.avatarURL('png') },
				description: 'Mafia is a game of deception, strategy, and psychology that is played with a group of people, ranging from 4 to 20 players.\n\n:white_circle: To initiate the game, you can use **`/start`**;\n:white_circle: To get roles information, you can use **`/roles`**;\n:white_circle: To activate your power **in game**, you can use **`/activate`**;\n:white_circle: To configure me, you can use **`/set`**;\n:white_circle: To forcefully close the games, you can use **`/clear_cache`**.\n\n:exclamation:**We recommend you not having admin during game & having DMs opened.**',
			}],
		});
	}
};