const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

module.exports = class Utilities {
	/**
     * @typedef {import('oceanic.js').Client} Client
     * @param {Client} client the client
    */
	constructor(client) {
		this.client = client;
	}
	get directory() {
		return `${path.dirname(require.main.filename)}${path.sep}`;
	}

	async loadInteractions() {
		const interactions = await glob(`${this.directory}Commands/*.js`);
		const commands = [];

		for (const interactionFile of interactions) {
			delete require.cache[interactionFile];
			const { name } = path.parse(interactionFile);
			const File = require(interactionFile);
			const interaction = new File(this.client, name.toLowerCase());

			this.client.interactions.set(interaction.name, interaction);
			commands.push(interaction);
		}

		if (this.client.devMode) {
			this.client.application.bulkEditGuildCommands('795393018764591134', commands);
		}
		else {
			this.client.application.bulkEditGlobalCommands(commands);
		}
	}
	async loadEvents() {
		const events = await glob(`${this.directory}Events\\*.js`);

		for (const eventFile of events) {
			delete require.cache[eventFile];
			const { name } = path.parse(eventFile);
			const File = require(eventFile);
			const event = new File(this.client, name);

			this.client.events.set(event.name, event);
			event.emitter[event.type](name, (...args) => event.run(...args));
		}
	}
};