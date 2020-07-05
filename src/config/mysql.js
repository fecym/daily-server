const mysqlConf = {
  database: 'daily',
  user: 'root',
  password: 'root',
  // SQL默认端口
  port: '3306',
  host: 'localhost',
  multipleStatements: true // 允许多条sql同时执行
};
module.exports = mysqlConf;
