const Oceanic = require('oceanic.js');
const ms = require('ms');
const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'set',
			description: 'Set the bot\'s behavior for this server.',

			options: [
				{
					name: 'category',
					description: 'Change under what category the channel gets created.',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'category',
							description: 'The category to set.',
							type: Oceanic.ApplicationCommandOptionTypes.CHANNEL,
							channelTypes: [Oceanic.ChannelTypes.GUILD_CATEGORY],
							required: true,
						},
					],
				},
				{
					name: 'max_players',
					description: 'Restrict the maximum players in a game.',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'players',
							description: 'How many players there should be, in numbers.',
							type: Oceanic.ApplicationCommandOptionTypes.NUMBER,
							required: true,
						},
					],
				},
				{
					name: 'timeout',
					description: 'Set the timeout for a lobby, default: 60s',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'time',
							description: 'How much time a lobby lasts without being started.',
							type: Oceanic.ApplicationCommandOptionTypes.STRING,
							required: true,
						},
					],
				},
				{
					name: 'channel_deletion_timeout',
					description: 'Set the timeout for deleting the channel after the game finished, default: 60s',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'time',
							description: 'How much time a game channel should last after game ended.',
							type: Oceanic.ApplicationCommandOptionTypes.STRING,
							required: true,
						},
					],
				},
				{
					name: 'day_interval',
					description: 'Set the game\'s day interval, default: 60s',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'time',
							description: 'How much time the day should last.',
							type: Oceanic.ApplicationCommandOptionTypes.STRING,
							required: true,
						},
					],
				},
				{
					name: 'vote_interval',
					description: 'Set the game\'s vote interval, default: 30s',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'time',
							description: 'How much time a voting session should last.',
							type: Oceanic.ApplicationCommandOptionTypes.STRING,
							required: true,
						},
					],
				},
				{
					name: 'list',
					description: 'List all the settings.',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
				},
				{
					name: 'viewable',
					description: 'Wether or not the game channel should be visible to the other players',
					type: Oceanic.ApplicationCommandOptionTypes.SUB_COMMAND,
					options: [
						{
							name: 'boolean',
							description: 'Wether or not the game channel should be visible to the other players',
							type: Oceanic.ApplicationCommandOptionTypes.BOOLEAN,
							required: true,
						},
					],
				},
			],
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		if(!interaction.member.permissions.has('MANAGE_GUILD')) {
			await interaction.defer(64);
			return interaction.createFollowup({ content: 'Sorry, this command was locked behind the `MANAGE_GUILD` permission for security reasons.' });
		}
		await interaction.defer();

		switch(interaction.data.options.raw[0].name) {
		case 'list': {
			const data = await this.client.database.db_fetch({ id: interaction.guildID });

			let settings = '';
			const entries = Object.entries(data);

			for(const entry of entries) {
				if(['id', '_id'].includes(entry[0])) continue;

				if (typeof entry[1] === 'number' && entry[1] >= 1000) entry[1] = ms(entry[1]);
				settings += `\`${entry[0]}\`: ${entry[1]}\n`;
			}
			return interaction.createFollowup({ embeds: [{
				title: 'Server settings',
				color: 0x00ff00,
				description: settings,
				footer: { text: 'Raw data.' },
			}] });
		}
		case 'category': {
			const category = interaction.data.options.getChannel('category');

			if(category.type !== Oceanic.ChannelTypes.GUILD_CATEGORY) {
				return interaction.createFollowup({ content: 'Please mention a category.' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`category\` to ${category.id}` });
			return this.client.database.db_update({ id: interaction.guildID, data: { category: category.id } });
		}
		case 'max_players': {
			const players = interaction.data.options.getNumber('players');

			if(players < 4 || players > 20) {
				return interaction.createFollowup({ content: 'Please mention a player amount within the range of: `4-20`' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`max_players\` to **${players}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { max_players: players } });
		}
		case 'viewable': {
			const boolean = interaction.data.options.getBoolean('boolean');

			interaction.createFollowup({ content: `Sucessfully set \`viewable\` to **${boolean}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { viewable: boolean } });
		}
		case 'timeout': {
			const time = interaction.data.options.getString('time');
			const timeInMs = ms(time);

			if(timeInMs < 60_000 || timeInMs > 300_000) {
				return interaction.createFollowup({ content: 'Please mention a time within the range of: `60s-5m`' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`lobby_timeout\` to **${timeInMs}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { lobby_timeout: timeInMs } });
		}
		case 'day_interval': {
			const time = interaction.data.options.getString('time');
			const timeInMs = ms(time);

			if(timeInMs < 60_000 || timeInMs > 300_000) {
				return interaction.createFollowup({ content: 'Please mention a time within the range of: `60s-5m`' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`day_interval\` to **${timeInMs}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { day_interval: timeInMs } });
		}
		case 'vote_interval': {
			const time = interaction.data.options.getString('time');
			const timeInMs = ms(time);

			if(timeInMs < 30_000 || timeInMs > 300_000) {
				return interaction.createFollowup({ content: 'Please mention a time within the range of: `30s-5m`' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`vote_interval\` to **${timeInMs}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { vote_interval: timeInMs } });
		}
		case 'channel_deletion_timeout': {
			const time = interaction.data.options.getString('time');
			const timeInMs = ms(time);

			if(timeInMs < 30_000 || timeInMs > 300_000) {
				return interaction.createFollowup({ content: 'Please mention a time within the range of: `30s-5m`' });
			}

			interaction.createFollowup({ content: `Sucessfully set \`channel_deletion_timeout\` to **${timeInMs}**` });
			return this.client.database.db_update({ id: interaction.guildID, data: { channel_deletion_timeout: timeInMs } });
		}
		}
	}
};