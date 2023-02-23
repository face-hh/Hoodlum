const Event = require('../Structures/EventBase');

module.exports = class extends Event {
	run(err) {
		console.log(err);
	}
};