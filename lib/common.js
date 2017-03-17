import Sequelize from 'sequelize';
import { Logger, transports } from "winston";
import config from './config';

const logLevel = 'log-level' in config ? config['log-level'] : 'debug';

export const logger = new Logger({
	transports: [
		new transports.Console({ level: logLevel }),
	]
});

export const sequelize = new Sequelize(config.database, { logging: logLevel === 'debug' ? undefined : false });

