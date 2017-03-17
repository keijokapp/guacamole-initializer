import crypto from 'crypto';
import { sequelize } from '../common';

export default async function(username) {

	const rand = await new Promise((resolve, reject) => {
		crypto.randomBytes(64, (err, data) => {
			if(err) reject(err);
			else resolve(data);
		});
	});

	const salt = rand.slice(0, 32);
	const password = rand.slice(32).toString('hex');

	const hash = crypto.createHash('sha256');
	hash.end(password + salt.toString('hex').toUpperCase());
	const passwordHash = hash.read();

	const result = await sequelize.query('insert into guacamole_user(username, password_salt, password_hash, timezone)'
	                                   + ' values(:username, :salt, :passwordHash, \'UTC\')'
	                                   + ' on duplicate key update password_salt=:salt, password_hash=:passwordHash', {
		replacements: { username, salt, passwordHash }
	});
	const userId = result[0].insertId;

	return {
		id: userId,
		username: username,
		password: password
	}
}
