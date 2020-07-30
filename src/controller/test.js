/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-06-07 16:33:43
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-09-10 22:50:24
 */

const { connectionPool, writeJson, formatData } = require('../utils');
const { queryAll } = require('../utils/sql');
import { ERROR_MESSAGE } from '../utils/constant';

/* GET users listing. */
function test(req, res, next) {
  console.log(req.query);
  // connectionPool('select * from user;').then(data => {
  connectionPool(queryAll, ['user'])
    .then(data => {
      console.log(data);
      if (data) {
        data = formatData(data);
        writeJson(res, 200, 'ok', data);
      } else {
        writeJson(res, 200, 'ok', null);
      }
    })
    .catch(err => {
      console.log('test -> err', err);
      writeJson(res, 500, ERROR_MESSAGE, null);
    });
}
function hello() {
  console.log('hello');
}

// module.exports = test;
// export default { test, hello }
module.exports = { test, hello };
