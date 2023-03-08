const { Client } = require('oceanic.js');
const Utils = require('./Utilities');
const Database = require('./Database');


module.exports = class BotClient extends Client {
	constructor(options = {}) {
		const devMode = false;

		super({ auth: devMode ? process.env.devToken : process.env.token, gateway: { intents: ['MESSAGE_CONTENT', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILDS'] } });

		this.validate(options);

		this.defaultData = {
			max_players: 20,
			category: null,
			viewable: true,
			lobby_timeout: 120_000,
			day_interval: 60_000,
			vote_interval: 30_000,
			channel_deletion_timeout: 60_000,
		};
		this.defaultDataUsers = {
			none_wins: 0,
			town_wins: 0,
			mafia_wins: 0,
			games: 0,
		};

		this.utils = new Utils(this);

		this.database = new Database(this, { collection: 'guilds' });
		this.userDatabase = new Database(this, { collection: 'users' });

		this.interactions = new Map();
		this.events = new Map();
		this.data = [];

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
