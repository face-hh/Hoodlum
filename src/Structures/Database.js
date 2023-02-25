const mongodb = require('mongodb');
const { MongoClient } = mongodb;
let client;

module.exports = class State {
	constructor(bot, { collection }) {
		if (!client) {
			client = new MongoClient(process.env.mongo_uri);
			client.connect();
		}

		this.bot = bot;
		this.client = client;
		this.db = client.db('intern');
		this.collection = this.db.collection(collection);

		this.defaultData = collection === 'users' ? bot.defaultDataUsers : bot.defaultData;
	}

	/**
     * @param {String} progress The index of the current stories.
     * @param {Object} options The options for the current text.
     * @param {Object} id The distinguishable ID of a certain data piece.
     */
	async db_update({ data, id }) {
		delete data._id;

		const defaultData = Object.assign({}, this.defaultData);

		for (const key in defaultData) {
			if (key in data) {
				delete defaultData[key];
			}
		}

		this.collection.updateOne({ id }, { $set: data, $setOnInsert: defaultData }, { upsert: true });

		return true;
	}

	/**
     * @param {Object} query The query that has to be matched.
     */
	async db_fetch(query) {
		let data = await this.collection.findOne(query);
		const defaultData = Object.assign({}, this.defaultData);

		if (!data) {

			defaultData.id = query.id;
			await this.collection.insertOne(defaultData);
			data = await this.collection.findOne({ id: query.id });
			return data;
		}

		return data;
	}
	/**
     * @param {Object} query The query that has to be matched.
     */
	async db_remove(query) {
		await this.collection.deleteOne(query).catch(() => { return false; });

		return true;
	}
	/**
     * @param {Object} query The query that has to be matched.
     */
	async db_all(query) {
		const data = await this.collection.find(query).toArray();

		if (!data) return false;

		return data;
	}
};