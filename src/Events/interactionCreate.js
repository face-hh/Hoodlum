const Oceanic = require('oceanic.js');
const Event = require('../Structures/EventBase');

module.exports = class extends Event {
	/**
	 * @typedef {import('oceanic.js').Interaction} Interaction
	 * @param {Interaction} interaction
	 */
	async run(interaction) {
		if(interaction instanceof Oceanic.CommandInteraction) {

			if (!interaction.guildID) return;
			try {
				const command = this.client.interactions.get(interaction.data.name);
				if (!command) return;

				// const timestamps = this.client.cooldowns.get(command.name);

				// if (timestamps.has(interaction.member.user.id)) {
				// 	const expirationTime = timestamps.get(interaction.member.user.id) + command.cooldown;
				// 	if (Date.now() > expirationTime) return;

				// 	const timeLeft = this.client.utils.ms((timestamps.get(interaction.member.id) + command.cooldown) - Date.now());

				// 	await interaction.acknowledge(64);
				// 	return interaction.createFollowup({ content: `⏰ | This command is on cooldown for \`${timeLeft}\``, flags: 64 });
				// }

				this.client.emit('command', interaction);

				// await timestamps.set(interaction.member.user.id, Date.now());
				// setTimeout(async () => await timestamps.delete(interaction.member.user.id), command.cooldown);

				if(!interaction.options) return await command.run(interaction, this.client);

				await command.run(
					interaction,
					interaction.options._options.map((value) => value.value),
				);
			}
			catch (err) {
				interaction.channel.createMessage({ content: 'Something went wrong!' });

				this.client.devMode === true ? console.error(err) : console.log(`Error caught: ${err}`);
			}
		}

	}
};