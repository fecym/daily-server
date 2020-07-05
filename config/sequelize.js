import { Sequelize } from 'sequelize'
import mysqlConf from '../config/mysql'

export const sequelize = new Sequelize(mysqlConf.database, mysqlConf.user, mysqlConf.password, {
  host: mysqlConf.host,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 30000,
  },
});

export async function testConnect() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

