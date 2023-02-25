const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'clear_cache',
			description: 'Clear the cache of the guild in case something goes wrong.',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		await interaction.defer();

		delete this.client.data[interaction.guildID];

		return interaction.createFollowup({ content: 'Cleared the server\'s game cache.' });
	}
};