const fs = require('fs');
const path = require('path');
const image = fs.readFileSync(path.resolve('src/Assets/roles.png'));
const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'roles',
			description: 'Get the information about all the roles!',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		await interaction.defer();

		interaction.createFollowup({
			content: 'Here is a visual representation of the game\'s roles!',
			files: [{
				name: 'roles.png',
				contents: image,
			}],
		});
	}
};