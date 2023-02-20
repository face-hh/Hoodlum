const { Client } = require('oceanic.js');
const Utils = require('./Utilities');

module.exports = class BotClient extends Client {
	constructor(options = {}) {
		const devMode = true;

		super({ auth: devMode ? process.env.devToken : process.env.token });

		this.validate(options);

		this.utils = new Utils(this);

		this.interactions = new Map();
		this.events = new Map();

		this.devMode = devMode;
	}

	validate(options) {
		if (typeof options !== 'object') {throw new TypeError('Options should be a type of Object.');}

		this.token = options.token;
		this.devMode = options.devmode;
	}

	async connect() {
		await this.utils.loadEvents();

		await super.connect();
	}
};