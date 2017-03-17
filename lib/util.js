import util from 'util';
import { parse as parseUrl } from "url";
import http from "http";
import https from "https";

export async function request(req) {
	var options = parseUrl(req.url);
	options.method = req.method;

	if('headers' in req) options.headers = req.headers;
	else options.headers = {};

	if(typeof req.payload === 'string')
		options.headers['content-length'] = Buffer(req.payload, 'utf8').length;

	var httpModule = http;
	if(options.protocol === 'https:') {
		httpModule = https;
		if('verify' in req) options.rejectUnauthorized = !!req.verify;
	}

	if('localAddress' in req) options.localAddress = req.localAddress;

	return new Promise((resolve, reject) => {
		var request = httpModule.request(options, response => {

			var chunks = [];

			response.on('data', chunk => {
				chunks.push(chunk);
			});

			response.on('end', () => {
				var res = {
					status: response.statusCode,
					headers: response.headers,
					payload: Buffer.concat(chunks).toString('utf8')
				};
				resolve(res);
			});
		});

		request.on('error', e => {
			reject(e);
		});

		if(typeof req.timeout === 'number') {
			request.setTimeout(req.timeout)
		}

		if(typeof req.payload === 'string') {
			request.write(req.payload);
		}

		request.end();
	});
}

