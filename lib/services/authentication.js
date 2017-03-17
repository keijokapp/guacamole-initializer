import config from '../config';
import { request } from '../util';
import { logger } from '../common';

export default async function(username, password) {
	const x = await request({
		method: 'POST',
		url: config['guacamole-url'] + '/api/tokens',
		headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' },
		payload: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password)//JSON.stringify({ username, password })
	});

	if(x.status !== 200) {
		logger.error('authenticationService: response: ', x.payload)
		throw new Error('authenticationService: Bad status code: ' + x.status);
	}

	const response = JSON.parse(x.payload);

	return response;
}
