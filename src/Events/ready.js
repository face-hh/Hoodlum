const Event = require('../Structures/EventBase');

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			once: true,
		});
	}
	async run() {
		console.log('Logged in as', this.client.user.tag);
		this.client.utils.loadInteractions();
	}
};