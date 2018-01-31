// @flow

import MySqlConnection from 'mysql-easier';
import objectMapper from 'object-mapper';

// Get database configuration from a JSON file.
let config = require('../config.json');

// ALlow values to be overridden by environment variables.
// This specifies how environment variable names
// map to nested configuration properties.
const envConfigMap = {
  DB_HOST: 'db.host',
  DB_PORT: 'db.port',
  DB_USER: 'db.user',
  DB_PASSWORD: 'db.password'
};
config = objectMapper(process.env, config, envConfigMap);

export const getDbConnection = () => new MySqlConnection(config.db);

export function getTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
