// @flow

import MySqlConnection from 'mysql-easier';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartdevice'
};

export const getDbConnection = () => new MySqlConnection(dbConfig);

