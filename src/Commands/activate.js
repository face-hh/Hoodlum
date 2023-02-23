const Oceanic = require('oceanic.js');
const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'activate',
			description: 'Activate your powers in-game!',
			options: [
				{
					type: Oceanic.ApplicationCommandOptionTypes.USER,
					name: 'player',
					description: 'The player you want to revive.',
					required: false,
				},
			],
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	run() {
		//
	}
};