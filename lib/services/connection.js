import assert from 'assert';
import { sequelize } from '../common';

export default async function(user, name, type, hostname, port, username, password) {
	assert.notEqual(['rdp'].indexOf(type), -1);

	const maxConnections = 2;
	const maxConnectionsPerUser = 2;

	return sequelize.transaction(async transaction => {

		var result;

		result = await sequelize.query('insert into guacamole_connection(connection_name, protocol, max_connections, max_connections_per_user) values(?, ?, ?, ?);', {
			replacements: [ name, type, maxConnections, maxConnectionsPerUser ],
			transaction
		});
		const connectionId = result[0].insertId;
		result = await sequelize.query('insert into guacamole_connection_parameter(connection_id, parameter_name, parameter_value)'
		                             + ' values (?, \'hostname\', ?), (?, \'port\', ?), (?, \'username\', ?), (?, \'password\', ?);', {
			replacements: [ connectionId, hostname, connectionId, port, connectionId, username, connectionId, password ],
			transaction
		});
		result = await sequelize.query('insert into guacamole_connection_permission(user_id, connection_id, permission) values ((SELECT user_id from guacamole_user WHERE username=?), ?, \'READ\');', {
			replacements: [ user, connectionId ],
			transaction
		});

		return Buffer(connectionId + '\0c\0mysql').toString('base64');
	})
}
