const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'start',
			description: 'Initiate a game of Mafia.',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		interaction.createFollowup({
			content: `<@${interaction.user.id}> has initiated a **Mafia** game!`,
		});
	}
};