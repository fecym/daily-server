// mysqljs中的语法， ? 代表变量， 双 ?? 表名或者字段名，单 ? 则是value
module.exports = {
  queryAll: 'SELECT * FROM ?? WHERE is_del=0',
  queryById: 'SELECT * FROM ?? WHERE id=? AND is_del=0',
  queryByMulti: 'SELECT * FROM ?? WHERE ??=? AND ??=? AND is_del=0',
  queryPrimaryByUser: 'SELECT * FROM user WHERE username=? AND is_del=0',
  del: 'DELETE FROM ?? WHERE id=?',
  // 列出表中所有字段名
  showAllFieldName: 'SHOW COLUMNS FROM ?? FROM ??'
}