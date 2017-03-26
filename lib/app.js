import { parse as urlParse } from 'url';
import crypto from 'crypto';
import http from 'http';
import { Validator } from 'jsonschema';
import config from './config';
import { logger } from './common';
import connectionService from './services/connection';
import authenticationService from './services/authentication';
import userService from './services/user';

function encrypt(data, key) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	cipher.end(data);
	const authTag = cipher.getAuthTag();
	const message = cipher.read();
	return Buffer.concat([ iv, authTag, message ]).toString('base64');
}

function decrypt(message, key) {
	message = Buffer(message, 'base64');
	const iv = message.slice(0, 12);
	const authTag = message.slice(12, 28);
	message = Buffer(message.slice(28));
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);
	decipher.end(message);
	const data = decipher.read().toString('utf8');
	return data;
}

function decryptRequestData(data) {
	var error;
	for(const decryptionKey of config['decryption-keys']) {
		try {
			return JSON.parse(decrypt(data, decryptionKey));
		} catch(e) {
			error = e;
		}
	}
	throw error;
}

const validator = new Validator;
const requestDataSchema = {
	"$schema": "http://json-schema.org/draft-04/schema#",
	"type": "object",
	"properties": {
		"guacamole-username": {
			"type": "string"
		},
		"hostname": {
			"type": [ "string", "null" ]
		},
		"name": {
			"type": "string"
		},
		"password": {
			"type": "string"
		},
		"port": {
			"type": "integer"
		},
		"type": {
			"type": "string"
		},
		"username": {
			"type": "string"
		}
	},
	"required": [ "username", "name", "guacamole-username",
	              "password", "type", "port" ]
}
function validateRequestData(data) {
	return validator.validate(data, requestDataSchema, { throwError: true });
}

const cookiePath = urlParse(config['guacamole-url']).path;

async function controller(req, res) {
	var connection = decryptRequestData(req.url.slice(1));

	logger.info('Connection: ', connection);

	validateRequestData(connection);

	if(!('hostname' in connection) || connection.hostname === null) {
		if(!('default-hostname' in config)) throw new Error('Hostname not specified');
		connection.hostname = config['default-hostname'];
	}

	const user = await userService(connection['guacamole-username']);
	logger.info('User: ', user);

	connection.connection = await connectionService(user.username, connection.name, connection.type, connection.hostname, connection.port, connection.username, connection.password);

	const authData = await authenticationService(user.username, user.password);
	logger.info('Auth data: ', authData);

	const redirectUrl = config['guacamole-url'] + '/#/client/' + encodeURIComponent(connection.connection);
	res.writeHead(301, {
		// FIXME: what if path contains semicolon?
		'set-cookie': 'GUAC_AUTH=' + encodeURIComponent(JSON.stringify(authData)) + '; path=' + cookiePath + ';' + (config['secure-cookie'] ? 'Secure' : ''),
		'location': redirectUrl,
		'cache-control': 'no-cache',
		'content-type': 'application/json'
	});

	// FIXME: just hope redirectUrl does not contain any HTML special characters...?
	res.end(JSON.stringify('You should be redirected to <a href="' + redirectUrl + '">' + redirectUrl + '</a>'));
}

export default async function(req, res) {
	try {
		await controller(req, res);
	} catch(e) {
		logger.error(e);
		res.statusCode = 500;
		res.end('Invalid input or unexpected error has happened in application. We have been notified.');
	}
}
