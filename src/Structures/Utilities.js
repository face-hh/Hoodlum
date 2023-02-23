const path = require('path');
const Oceanic = require('oceanic.js');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const { InteractionCollector, MessageCollector } = require('oceanic-collectors');
const dayInterval = 60000;
const voteInterval = 30000;
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const roles = [
	{ team: 'None', max: 1, icon: '🎭', name: 'Buffoon', description: 'A player who is neither part of the impostor and whose objective is to be eliminated by the town players.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/performing-arts_1f3ad.png' },
	{ team: 'Town', max: 1, icon: '🎩', name: 'Mayor', description: 'A town player that can reveal their role during the game for gaining +1 vote privileges.', leaked: false, url: 'https://em-content.zobj.net/thumbs/120/twitter/322/top-hat_1f3a9.png' },
	{ team: 'Mafia', max: 1, icon: '👨‍💻', name: 'Hacker', description: 'A mafia player that can skip voting with 40% success, but if they fail, their identity is leaked.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/man-technologist_1f468-200d-1f4bb.png' },
	{ team: 'Town', max: 3, icon: '💉', name: 'Medic', description: 'A town player that can revive someone from death once.', alreadyRevived: false, url: 'https://em-content.zobj.net/thumbs/120/twitter/322/syringe_1f489.png' },
	{ team: 'Town', max: 1, icon: '🕵️', name: 'Espionage', description: 'A town player that gets to see the messages that were sent by the Mafia at night once.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/detective_1f575-fe0f.png' },
	{ team: 'Town', max: 2, icon: '🧙', name: 'Necromancer', description: 'A town player that can communicate with the deads, receiving hints about their killers.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/mage_1f9d9.png' },
	{ team: 'Mafia', max: 4, icon: '🤵🏻', name: 'Mafia', description: 'A mafia player that has the ability to vote who will be killed the next day.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/person-in-tuxedo_light-skin-tone_1f935-1f3fb_1f3fb.png' },
	{ team: 'Town', max: 5, icon: '👨🏻‍🌾', name: 'Burgher', description: 'A town player that has the ability to vote who will be voted out the next day.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/man-farmer_1f468-200d-1f33e.png' },
	{ team: 'Town', max: 1, icon: '🪓', name: 'Executioner', description: 'A town player that can kill one person themselves.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/axe_1fa93.png' },
	{ team: 'Town', max: 1, icon: '🤡', name: 'Bait', description: 'A town player that will leak the name of the person that killed them.', url: 'https://em-content.zobj.net/thumbs/120/twitter/322/clown-face_1f921.png' },
];

let voteSystemCollector;

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

	generateRandomID() {
		let id = '#';
		for (let i = 0; i < 6; i++) {
			id += characters.charAt(Math.floor(Math.random() * characters.length));
		}

		if(this.client.data.find((el) => el.lobbyID === id)) return this.generateRandomID();
		return id;
	}

	mapIDs(data) {
		if(Array.isArray(data)) {
			return `${data.map((x) => `<@${x.id}>`).join(', ')} (**${data.length}**)`;
		}
		else {
			return `${data.originalPlayers.map((x) => `<@${x}>`).join(', ')} (**${data.originalPlayers.length}**)`;
		}
	}

	assignRoles(playerIds, data) {
		const shuffledRoles = roles.sort(() => Math.random() - 0.5);

		if(playerIds.length <= 10) {
			roles.find((el) => el.name === 'Burgher').max = 1;
			roles.find((el) => el.name === 'Mafia').max = 1;
			roles.find((el) => el.name === 'Hacker').max = 1;
			roles.find((el) => el.name === 'Necromancer').max = 1;
			roles.find((el) => el.name === 'Medic').max = 1;
		}
		data.originalRoles = [];

		const assignedCounts = {};

		let hasMafia = false;

		let i = 0;
		const assignedRoles = playerIds.sort(() => Math.random() - 0.5).map((id) => {
			// if(i === 0) {
			// 	i++;
			// 	const mafiaRole = shuffledRoles.find((el) => el.name === 'Bait');

			// 	data.originalRoles.push({ id, role: mafiaRole });
			// 	return { id, role: mafiaRole };
			// }
			const role = shuffledRoles.find((r) => r.max > (assignedCounts[r.name] || 0));

			if (!role) return undefined;
			if(role.team === 'Mafia') hasMafia = true;

			assignedCounts[role.name] = (assignedCounts[role.name] || 0) + 1;

			if(i === (playerIds.length - 1) && !hasMafia) {
				const mafiaRole = shuffledRoles.find((el) => el.team === 'Mafia');

				data.originalRoles.push({ id, role: mafiaRole });
				return { id, role: mafiaRole };
			}

			data.originalRoles.push({ id, role });
			i++;
			return { id, role };
		});
		console.log(assignedRoles);
		return assignedRoles.filter((x) => x !== undefined);
	}

	initiatePermissions(interaction, type, data) {
		const permissions = [
			{
				allow: Oceanic.Permissions.VIEW_CHANNEL,
				deny: Oceanic.Permissions.SEND_MESSAGES | Oceanic.Permissions.ATTACH_FILES | Oceanic.Permissions.EMBED_LINKS,
				id: interaction.guildID,
				type: Oceanic.OverwriteTypes.ROLE,
			},
		];

		switch(type) {

		case 'global':
			data.players.forEach((player) => {
				permissions.push({
					allow: Oceanic.Permissions.VIEW_CHANNEL | Oceanic.Permissions.SEND_MESSAGES,
					deny: 0n,
					id: player?.id || player,
					type: Oceanic.OverwriteTypes.MEMBER,
				});
			});
			break;
		case 'everyone':
			data.originalPlayers.forEach((player) => {
				permissions.push({
					allow: Oceanic.Permissions.VIEW_CHANNEL | Oceanic.Permissions.SEND_MESSAGES,
					deny: 0n,
					id: player?.id || player,
					type: Oceanic.OverwriteTypes.MEMBER,
				});
			});
			break;
		case 'onlyMafia':
			data.players.forEach((player) => {
				if(player.role.team !== 'Mafia') {
					permissions.push({
						allow: 0n,
						deny: Oceanic.Permissions.VIEW_CHANNEL | Oceanic.Permissions.SEND_MESSAGES,
						id: player.id,
						type: Oceanic.OverwriteTypes.MEMBER,
					});
				}
				else {
					permissions.push({
						allow: Oceanic.Permissions.VIEW_CHANNEL | Oceanic.Permissions.SEND_MESSAGES,
						deny: 0n,
						id: player?.id || player,
						type: Oceanic.OverwriteTypes.MEMBER,
					});
				}
			});
			break;
		}

		return permissions;
	}
	async generateVoteField(noMafia) {
		let componentsArray = [
			{
				type: 1, components: [],
			},
			{
				type: 1, components: [],
			},
			{
				type: 1, components: [],
			},
			{
				type: 1, components: [],
			},
		];
		let actionRow = 0;

		const votes = {};
		const buttonIDs = [];
		const skipID = String(Math.random());

		for(let i = 0; i < (noMafia.length + 1); i++) {
			const member = noMafia[i];
			const id = String(Math.random());
			const order = i % 5;

			if(order === 0 && i !== 0) actionRow++;

			if(member) {
				const target = this.client.users.get(member.id);

				buttonIDs.push({ id: id, user: member.id, tag: target.tag });

				votes[member.id] = 0;


				componentsArray[actionRow].components.push({ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.PRIMARY, label: target.username, customID: id });
			}
			else {
				votes.skip = 0;
				componentsArray[actionRow].components.push({ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.SECONDARY, label: 'Skip', customID: skipID });
			}
		}

		componentsArray = componentsArray.filter((el) => el.components.length !== 0);

		return { componentsArray, votes, buttonIDs, skipID };
	}

	async createVoteSystem({ data, buttonIDs, skipID, Mafia = false, votes, votesCounter, messageCollector = false }, callback) {
		voteSystemCollector = new InteractionCollector(this.client, {
			time: voteInterval,
		});
		const alreadyVoted = [];

		function stopCollecting() {
			if(!voteSystemCollector) return;
			voteSystemCollector.stop();
			voteSystemCollector = undefined;

			setTimeout(async () => {
				const votesSorted = Object.fromEntries(Object.entries(votes).sort(([, a], [, b]) => a - b));
				const lastIndex = Object.keys(votesSorted).length;

				const mostVoted = Object.entries(votesSorted)[lastIndex - 1];
				const mostVoted2 = Object.entries(votesSorted)[lastIndex - 2] || [0, 0];

				if(messageCollector) messageCollector.stop();

				callback(mostVoted, mostVoted2);
			}, 2000);
		}

		voteSystemCollector.on('end', (_, reason) => {
			if(reason === 'time') {
				stopCollecting();
			}
		});
		voteSystemCollector.on('collect', async (btn) => {
			if(!(btn instanceof Oceanic.ComponentInteraction)) return;

			const clickerData = buttonIDs.find((el) => el.id === btn.data.customID);
			const userData = data.players.find((el) => el.id === btn.user.id);

			if(!clickerData && btn.data.customID !== skipID) return;
			if(!userData) return;

			if(alreadyVoted.includes(btn.user.id)) {
				await btn.defer(64);
				return btn.createFollowup({ content: 'You already voted, sir.' });
			}

			await btn.defer();

			if(btn.data.customID !== skipID) {
				votes[clickerData.user] += userData.leaked ? 2 : 1;
			}
			else {
				votes.skip += userData.leaked ? 2 : 1;
			}
			votesCounter++;
			alreadyVoted.push(btn.user.id);

			let messageContent = `<@${btn.user.id}> has voted for ${clickerData?.tag} (now at **${votes[clickerData?.user]} votes**)`;

			if(btn.data.customID === skipID) messageContent = `<@${btn.user.id}> has voted for **skip** (now at **${votes.skip} votes**)`;
			if(userData.leaked) messageContent = messageContent.replace(/^/, '🎩 ');

			await btn.createFollowup({ content: messageContent });

			const maxVotes = Mafia ? Mafia.length : data.players.length;

			if(votesCounter === maxVotes) {
				stopCollecting();
			}
		});
	}

	generateEmbed({ data, player, channel }) {
		let color = 0xffffff;

		if(player.role.team === 'Town') color = 0x00ff00;
		if(player.role.team === 'Mafia') color = 0xff0000;

		return [{
			title: `Game ${data.lobbyID}`,
			description: 'Objective: make your team win.',
			fields: [
				{ name: 'Role', value: `${player.role.icon} \`${player.role.name}\``, inline: true },
				{ name: 'Description', value: player.role.description, inline: true },
				{ name: 'Team', value: player.role.team, inline: true },
				{ name: 'How to use', value: `Run \`/activate\` in <#${channel.id}>`, inline: true },
			],
			thumbnail: { url: player.role.url },
			footer: { text: 'You may say your role to gain trust, but be aware: you can be the Mafia\'s target.' },
			color: color,
		}];
	}
	/**
	 * @typedef {Oceanic.CommandInteraction} CommandInteraction
	 * @param {CommandInteraction} interaction The interaction.
	 * @param {Object} data The data.
	 */
	async initiateGame(interaction, data) {
		const showRoleID = String(Math.random());
		const permissions = this.initiatePermissions(interaction, 'everyone', data);

		const channel = await interaction.guild.createChannel(Oceanic.ChannelTypes.GUILD_TEXT, {
			name: `Game ${data.lobbyID}`,
			permissionOverwrites: permissions,
		});
		const mappedIDs = this.mapIDs(data);
		const fields = roles.map(el => el = { name: `${el.icon} ${el.name}`, value: el.description, inline: true });

		channel.createMessage({
			content: mappedIDs,
			embeds: [
				{
					title: 'Welcome!',
					description: 'Peeps, check your DMs or click the button below.\n\n',
					fields: fields,
				},
			],
			components: [
				{
					type: Oceanic.ComponentTypes.ACTION_ROW,
					components: [
						{ type: Oceanic.ComponentTypes.BUTTON, style: Oceanic.ButtonStyles.PRIMARY, label: 'What\'s my role?', customID: showRoleID },
					],
				},
			],
		});

		const actualRoles = this.assignRoles(data.originalPlayers, data);

		data.players = actualRoles;

		data.players.forEach(async (player) => {
			try {
				const dmChannel = await this.client.users.get(player.id).createDM();

				// eslint-disable-next-line no-empty-function
				dmChannel?.createMessage({ content: 'Your roles', embeds: this.generateEmbed({ data, player, channel }) }).catch(() => {});
			}
			catch(e) {
				//
			}
		});
		const clientID = this.client;
		const collector = new InteractionCollector(this.client);

		collector.on('collect', async (btn) => {
			const userData = data.players.find((el) => el.id === btn.user.id);

			if(!userData) return;

			if(btn.data.name === 'activate') {
				if(btn.channel.id !== channel.id) return;

				const player = btn.data.options.getUser('player');

				switch(userData.role.name) {
				case 'Burgher':
					await btn.defer(64);
					await btn.createFollowup({ content: 'Sorry sir, you are a Burgher, you can only vote, rely on others!' });
					break;
				case 'Executioner': {
					if(!player) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'ayy no member mentioned to exec ⚜' });

						return;
					}

					if(data.deadPlayers.includes(player.id)) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'you can\'t kill the dead 😑' });
						return;
					}

					if(userData.alreadyKilled) return await btn.createFollowup({ content: 'You already killed someone.' });

					if(!data.originalPlayers.includes(player.id)) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'BRO MENTION SOMEONE THAT IS IN THE MATCH JESUS CHRIST 😭😭😭' });
						return;
					}

					data.deadPlayers.push(data.players.find((el) => el.id === player.id));

					data.players.splice(data.players.findIndex((el) => el.id === player.id), 1);

					userData.alreadyKilled = true;

					await channel.edit({ permissionOverwrites: this.initiatePermissions(interaction, 'global', data) });
					const dmChannel = await this.client.users.get(player.id).createDM();

					// eslint-disable-next-line no-empty-function
					dmChannel.createMessage({ content:'The 🪓 Executioner killed you, wait till the game ends to see the channel! Game ' + data.lobbyID }).catch(() => {});

					await btn.defer();
					await btn.createFollowup({ content: `🪓 <@${btn.user.id}> has executed <@${player.id}>!` });
					break;
				}
				case 'Mafia':
					await btn.defer(64);
					await btn.createFollowup({ content: 'Sorry sir, you are a Mafia member, you can\'t do anything else than voting!' });
					break;
				case 'Bait':
					await btn.defer(64);
					await btn.createFollowup({ content: 'Sorry sir, you are a Bait, your power is to leak the Mafia\'s name if they kill you, which is passive. Participate in Town\'s voting sesisons till then.' });
					break;
				case 'Mayor':
					userData.leaked = true;
					await btn.defer();
					await btn.createFollowup({ content: `<@${btn.user.id}> is the **Mayor**! Their vote now counts **twice**!` });
					break;
				case 'Hacker': {
					if(!voteSystemCollector) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'Caution mate, the hexagone ain\'t in yet.' });

						return;
					}
					if(userData.alreadyHacked) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'Ya\' already haxxed bruh 😭' });

						return;
					}

					const suceedRate = Math.floor(Math.random() * 100) + 1;

					userData.alreadyHacked = true;

					if(suceedRate >= 40) {
						await btn.defer();
						await btn.createFollowup({ content: `<@${btn.user.id}> tried to hack the votes, but they failed miserably. 🤡` });
					}
					else {
						if(!voteSystemCollector) {
							await btn.defer(64);
							await btn.createFollowup({ content: 'Caution mate, the hexagone ain\'t in yet.' });

							return;
						}
						await btn.defer(64);
						await btn.createFollowup({ content: 'Hacked ya\'' });

						await channel.createMessage({ content: '⚠ **THE VOTES HAVE BEEN HACKED!**' });
						voteSystemCollector.stop();
						this.runNight(interaction, channel, data);
					}
					break;
				}
				case 'Medic':
					if(!player) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'Mention someone to revive, mate!' });

						return;
					}

					// if(!data.deadPlayers.includes(player.id)) {
					// 	await btn.defer(64);
					// 	await btn.createFollowup({ content: 'oh ma god BRO YOU CANT HEAL THE ALIVE jesus' });
					// 	return;
					// }

					if(userData.alreadyRevived) return await btn.createFollowup({ content: 'You already revived someone brah 💀' });

					if(!data.originalPlayers.includes(player.id)) {
						await btn.defer(64);
						await btn.createFollowup({ content: 'BRO MENTION SOMEONE THAT IS IN THE MATCH JESUS CHRIST 😭😭😭' });
						return;
					}

					data.players.push(data.deadPlayers.find((el) => el.id === player.id));

					data.deadPlayers.splice(data.players.findIndex((el) => el.id === player.id), 1);

					userData.alreadyRevived = true;

					await channel.edit({ permissionOverwrites: this.initiatePermissions(interaction, 'global', data) });
					await btn.defer();
					await btn.createFollowup({ content: `💉 <@${btn.user.id}> has revived <@${player.id}>!` });
					break;
				case 'Espionage':
					await btn.defer(64);

					if(userData.alreadySpied) {
						return await btn.createFollowup({ content: 'You already spied.' });
					}
					if(!data.toDelete) {
						return await btn.createFollowup({ content: 'Sir, no records were found... seems like there was no Mafia meeting.' });
					}

					await btn.createFollowup({ content: 'Shhhh! 🤫' });

					userData.alreadySpied = true;

					await channel.createMessage({ content: 'Our 🕵️‍♂️ Espionage returned with records...', embeds: [{
						title: 'Mafia\'s last converation',
						description: data.toDelete.filter((el) => el.id !== clientID.user.id && el.content !== '').map((el) => `\`-\` ${el.content}`).join('\n'),
					}],
					});
					break;
				case 'Necromancer': {
					await btn.defer(64);

					if(userData.alreadyUsed) {
						return await btn.createFollowup({ content: 'Your dear sir, a session with the deads has already been set.' });
					}

					if(data.deadPlayers.length === 0) {
						return await btn.createFollowup({ content: 'Your honor, no deads have showed up!' });
					}

					await btn.createFollowup({ content: 'Mmm yes... okay... alright, I will tell them...' });

					const randomMafia = data.players.sort(() => Math.random() - 0.5).find((el) => el.role.team === 'Mafia');
					const randomMafiaUser = clientID.users.get(randomMafia.id).username.toUpperCase();
					const randomCharacter = randomMafiaUser[Math.floor(Math.random() * randomMafiaUser.length)];

					userData.alreadyUsed = true;

					await channel.createMessage({ content: 'The 🧙‍♂️ Necromancer just finished their session with the deads...', embeds: [{
						title: 'Found evidence',
						description: randomCharacter,
					}],
					});
					break;
				}
				}
			}
			if(btn.data.customID !== showRoleID) return;

			try {
				await btn.defer(64);

				await btn.createFollowup({ embeds: this.generateEmbed({ data, player: userData, channel }) });
			}
			catch(e) {
				console.log(e.message);
			}
		});

		this.runDay(interaction, channel, data);
	}

	async endGame(interaction, channel, data) {
		const client = this.client;

		let rolesDesc = '';

		console.log(data.originalRoles);
		for(let i = 0; i < data.originalRoles.length; i++) {
			const player = data.originalRoles[i];

			rolesDesc += `${player.role.icon} \`${player.role.name}\` - <@${player.id}>\n`;
		}
		await channel.edit({ permissionOverwrites: this.initiatePermissions(interaction, 'everyone', data) });

		channel.createMessage({ embeds: [
			{
				title: 'Roles',
				description: rolesDesc,
			},
		] });
		setTimeout(async () => {
			await channel.delete();
			delete client.data[interaction.guildID];
			console.log({ content: 'Cleared data', data: client.data });
		}, 30000);
	}
	async runDay(interaction, channel, data) {
		const time = Math.round((Date.now() + dayInterval) / 1000);
		channel.createMessage({ content: `Everyone is now able to chat. Discuss any topic you want, you have <t:${time}:R>.` });

		setTimeout(async () => {
			const { componentsArray, votes, buttonIDs, skipID } = await this.generateVoteField(data.players);

			const votesCounter = 0;

			const voteTime = Math.round((Date.now() + voteInterval) / 1000);

			channel.createMessage({
				content: `Voting ends in: <t:${voteTime}:R>`,
				embeds: [
					{
						title: 'Peeps, we gotta vote.',
						description: 'Vote below who you think is the Mafia.',
						color: 0x00ff00,
					},
				],
				components: componentsArray,
			});

			await this.createVoteSystem({ data, buttonIDs, skipID, votes, votesCounter, channel, interaction }, async (
				mostVoted,
				mostVoted2,
			) => {
				let plot;

				const Buffoon = data.players.find((el) => el.role.name === 'Buffoon')?.id;

				if(mostVoted[1] === mostVoted2[1] || mostVoted[1] === 0) {
					plot = 'There was a tie!';
				}
				else if(mostVoted[0] === 'skip') {
					plot = 'We skipped the voting session.';
				}
				else {
					data.deadPlayers.push(data.players.find((el) => el.id === mostVoted[0]));

					data.players.splice(data.players.findIndex((el) => el.id === mostVoted[0]), 1);
					plot = `Everyone decided to kill <@${mostVoted[0]}>.`;
				}

				const MafiaTeam = data.players.filter((el) => el.role.team === 'Mafia').length;

				if(Buffoon === mostVoted[0]) {
					await channel.createMessage({
						content: this.mapIDs(data.players),
						embeds: [
							{
								title: 'Everyone lost.',
								description: `😂 Haha! 🤪 You got trolled and 🗡️ you tried to kill me, but 🤡 jokes on you! - <@${Buffoon}>`,
								footer: { text: 'The channel will delete in 30 seconds.' },
								color: 0x00ff00,
							},
						],
					});

					await this.endGame(interaction, channel, data);

					return;
				}
				if(MafiaTeam === 0) {
					await channel.createMessage({
						content: this.mapIDs(data.players),
						embeds: [
							{
								title: 'The **mafia** lost.',
								description: '🎉 Town won.',
								footer: { text: 'The channel will delete in 30 seconds.' },
								color: 0x00ff00,
							},
						],
					});

					await this.endGame(interaction, channel, data);

					return;
				}

				await channel.createMessage({
					content: this.mapIDs(data.players),
					embeds: [
						{
							title: 'Let\'s count the votes...',
							description: plot,
							color: 0xff0000,
						},
					],
				});
				this.runNight(interaction, channel, data);
			});
		}, dayInterval);
	}

	async runNight(interaction, channel, data) {
		channel.createMessage({ content: 'The night comes in 10 seconds.' });

		setTimeout(async () => {
			const noMafia = data.players.filter((member) => member.role.team !== 'Mafia');
			const Mafia = data.players.filter((member) => member.role.team === 'Mafia');
			const votesCounter = 0;

			const { componentsArray, votes, buttonIDs } = await this.generateVoteField(noMafia);

			await channel.edit({ permissionOverwrites: this.initiatePermissions(interaction, 'onlyMafia', data) });

			channel.createMessage({
				content: this.mapIDs(Mafia),
				embeds: [
					{
						title: 'Mafia, wake up!',
						description: 'You are free to talk, plan your next target!',
						color: 0x00ff00,
					},
				],
				components: componentsArray,
			});

			data.toDelete = [];

			const messageCollector = new MessageCollector(this.client, channel);

			messageCollector.on('collect', (m) => {
				data.toDelete.push({ id: m.author.id, content: m.content });
			});

			await this.createVoteSystem({ data, buttonIDs, Mafia, votes, votesCounter, channel, interaction, messageCollector }, async (
				mostVoted,
				mostVoted2,
			) => {
				let plot = '';

				if(mostVoted[1] === mostVoted2[1]) {
					plot = 'We survived, the Mafia couldn\'t agree on who to kill.';
				}
				else if(mostVoted[0] === 'skip') {
					plot = 'The Mafia skipped on killing anyone.';
				}
				else {
					data.deadPlayers.push(data.players.find((el) => el.id === mostVoted[0]));
					data.players.splice(data.players.findIndex((el) => el.id === mostVoted[0]), 1);
					plot = `Unfortunately, <@${mostVoted[0]}> has been killed by the Mafia.`;
				}

				const playerRole = data.originalRoles.find((el) => el.id === mostVoted[0]);
				const TownTeam = data.players.filter((el) => el.role.team !== 'Mafia').length;
				const MafiaTeam = data.players.filter((el) => el.role.team === 'Mafia');

				if(MafiaTeam.length >= TownTeam) {
					await channel.createMessage({
						content: this.mapIDs(data.players),
						embeds: [
							{
								title: 'Unfortunately, the **town** lost.',
								description: '🤵 Mafia won.',
								footer: { text: 'The channel will delete in 30 seconds.' },
								color: 0xff0000,
							},
						],
					});

					await this.endGame(interaction, channel, data);
					return;
				}

				await channel.createMessage({ content: 'History erased.' });
				await channel.purge({
					before: channel.lastMessage.id,
					limit: data.toDelete.length,
				});

				const dmChannel = await this.client.users.get(mostVoted[0]).createDM();

				// eslint-disable-next-line no-empty-function
				dmChannel.createMessage({ content:'The Mafia killed you, wait till the game ends to see the channel! Game ' + data.lobbyID }).catch(() => {});

				channel.edit({ permissionOverwrites: this.initiatePermissions(interaction, 'global', data) });

				await channel.createMessage({
					content: this.mapIDs(data.players),
					embeds: [
						{
							title: 'Wake up everyone!',
							description: plot,
							color: 0xff0000,
						},
					],
				});
				if(playerRole.role.name === 'Bait') {
					const individualMafia = MafiaTeam[Math.floor(Math.random() * MafiaTeam.length)];
					const name = this.client.users.get(individualMafia.id)?.username;

					await channel.createMessage({
						embeds: [
							{
								title: 'Hahahaha!',
								description: `The **Mafia** took the 🤡 **Bait**! Would be bad if I dropped this here.... **${name}**... oops! Better luck next time!`,
							},
						],
					});
				}
				this.runDay(interaction, channel, data);
			});
		}, 10000);
	}
};