// @flow

import MySqlConnection from 'mysql-easier';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartdevice',
  insecureAuth: true
};

export const getDbConnection = () => new MySqlConnection(dbConfig);

export function getTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
