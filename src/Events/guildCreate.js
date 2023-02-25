const Event = require('../Structures/EventBase');

module.exports = class extends Event {
	run(x) {
		this.client.guilds.get('795393018764591134').channels.get('1066395491262275694').createMessage({ content: `🟢 Joined \`${x.name}\` with **${x.memberCount}** members.` });
	}
};