require('dotenv').config();

const Hoodlum = require('./Structures/Bot');

const client = new Hoodlum();

client.connect();