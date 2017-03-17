#!/usr/bin/babel-node

import fs from 'fs';
import http from 'http';
import https from 'https';
import config from './lib/config';
import app from './lib/app';

const server = http.createServer(app);

server.listen(config.port, () => {
	const address = server.address();
	console.log('guacamole-initializer is listening on %s:%d', address.address, address.port);
});
