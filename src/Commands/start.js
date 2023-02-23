const Oceanic = require('oceanic.js');
const { InteractionCollector } = require('oceanic-collectors');
const InteractionBase = require('../Structures/CommandBase');

module.exports = class Interaction extends InteractionBase {
	constructor(...args) {
		super(...args, {
			name: 'start',
			description: 'Initiate a game of Mafia.',
		});
	}
	/**
	 * @typedef {import('oceanic.js').CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 */
	async run(interaction) {
		await interaction.defer();

		let data = this.client.data[interaction.guildID];
		if (!data) data = this.client.data[interaction.guildID] = { deadPlayers: [], originalPlayers: [interaction.user.id] };
		else return interaction.createFollowup({ content: 'A game is already running, please wait!' });

		const lobbyBtnID = String(Math.random());
		const lobbyID = this.client.utils.generateRandomID();
		const startID = String(Math.random());
		const leaveID = String(Math.random());

		data.lobbyID = lobbyID;

		const description = '⭐ A new **Mafia** game as been initiated!\n🔎 Rules: Teams **win** when opposing players die.\n‼ Almost everyone has a special **power**\n👥 Players: {p}';

		function merge(desc) {
			return desc.replace(/{p}/g, `${data.originalPlayers.map((x) => `<@${x}>`).join(', ')} (**${data.originalPlayers.length}**)`);
		}
		function stopLobby(collector, client) {
			collector.stop('user');
			interaction.editOriginal({
				embeds: [
					{
						title: 'The match has started!',
						description: merge('Have fun, peeps!\n👥 Players: {p}'),
					},
				],
				components: [],
			});

			client.utils.initiateGame(interaction, data);
		}

		const embed = {
			title: `GAME ID: ${lobbyID}`,
			description: merge(description),
			footer: { text: interaction.user.tag },
			thumbnail: { url: interaction.user.avatarURL('png') },
		};

		interaction.createFollowup({
			embeds: [embed],
			components: [
				{
					type: Oceanic.ComponentTypes.ACTION_ROW,
					components: [
						{ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.SUCCESS, label: 'Join', customID: lobbyBtnID },
						{ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.DANGER, label: 'Leave', customID: leaveID },
						{ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.PRIMARY, label: 'Start', customID: startID },
					],
				},
			],
		});

		const collector = new InteractionCollector(this.client, {
			time: 60000,
		});

		collector.on('end', (_, reason) => {
			if(reason === 'time') {
				delete this.client.data[interaction.guildID];
				interaction.channel.createMessage({ content: 'A game was initiated **60s**, due to lack of players/owner activity, it was cancelled. You are now able to use the command again.' });
			}
		});
		collector.on('collect', async (btn) => {
			if(!(btn instanceof Oceanic.ComponentInteraction)) return;
			await btn.defer(64);

			if(btn.data.customID === startID) {
				if(btn.user.id !== interaction.user.id) return btn.createFollowup({ content: 'Sorry, only the creator can start the game! Please wait until it reaches 10 players, or until the creator starts it!' });
				if(data.originalPlayers.length < 4) return btn.createFollowup({ content: 'Sorry, you need AT LEAST **4** players to start.' });

				stopLobby(collector, this.client);
				return btn.createFollowup({ content: 'You got it, boss!' });
			}

			if(btn.data.customID === leaveID) {
				if(!data.originalPlayers.includes(btn.user.id)) return btn.createFollowup({ content: 'You haven\'t joined yet.' });
				if(btn.user.id === interaction.user.id) return btn.createFollowup({ content: 'The leader can\'t leave.' });

				data.originalPlayers.splice(data.originalPlayers.indexOf(btn.user.id), 1);
				btn.createFollowup({ content: 'We removed you, cya!' });
				embed.description = merge(description);

				return interaction.editOriginal({ embeds: [embed] });
			}

			if(btn.data.customID !== lobbyBtnID) return;

			if(data.originalPlayers.includes(btn.user.id)) return btn.createFollowup({ content: 'You already joined...' });

			data.originalPlayers.push(btn.user.id);

			if(data.originalPlayers.length === 20) {
				return stopLobby(collector, this.client);
			}
			embed.description = merge(description);

			await btn.createFollowup({ content: 'We counted you in!' });

			interaction.editOriginal({ embeds: [embed] });
		});
	}
};