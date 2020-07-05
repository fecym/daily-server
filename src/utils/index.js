/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-07-06 20:29:32
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-10-22 23:12:51
 */
const mysql = require('mysql');
const mysqlConf = require('../config/mysql');
const pool = mysql.createPool(mysqlConf);
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Base64 } = require('js-base64');
const crypto = require('crypto');

// sql执行方法
/**
 * @description {执行SQL语句}
 * @param {sql语句} sql
 * @param {sql语句变量} options
 */
const connectionPool = (sql, options) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        sql = mysql.format(sql, options);
        console.log('------------ SQL语句 ------------', sql, '------------ SQL语句 ------------');
        connection.query(sql, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
          connection.release();
        });
      }
    });
  });
};

/**
 *
 * @param {*} code
 */
const decodeBase64 = (code) => {
  return Base64.decode(code);
};

/**
 *
 * @param {*} code
 */
const encodeBase64 = (code) => {
  return Base64.encode(code);
};

/**
 * 密码转 md5
 * @param {*} code
 */
const toMd5 = (code) => {
  return crypto.createHash('md5').update(code).digest('hex');
};

/**
 * @description {生成token}
 * @param {传入的数据} data
 */
const generateToken = (data) => {
  let privateKey = fs.readFileSync(path.resolve(__dirname, '../rsa_key/rsa_private_key.pem'));
  // 签发token，接受三个参数，载荷、私钥和一些配置
  return jwt.sign({ data }, privateKey, {
    algorithm: 'RS256',
    // 过期时间设置为1天，可使用秒或表示时间跨度 zeit / ms 的字符串表示。
    expiresIn: '1d'
  });
};

/**
 * @description {校验token是否正确}
 * @param {获取到的 Bearer token} token
 */
const verifyToken = (token) => {
  if (!token) return false;
  // 不要Bearer和空格，处理下token
  token = token.slice(7);
  const publicKey = fs.readFileSync(path.resolve(__dirname, '../rsa_key/rsa_public_key.pem'));
  let res = {};
  try {
    // 校验 token 会得到一个对象，其中 iat 是 token 创建时间，exp 是 token 到期时间
    const result = jwt.verify(token, publicKey, { algorithm: ['RE256'] }) || {};
    const { exp } = result;
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime <= exp) {
      res = result.data || {};
    }
    return res;
  } catch (err) {
    return err;
  }
};

/**
 * @description {返回状态信息}
 * @param {response} res
 * @param {自定义状态码} code
 * @param {状态信息} msg
 * @param {返回数据} data
 */
/* eslint-disable */
const writeJson = (res, code = 200, msg = 'ok', data = null) => {
  const obj = { code, msg, data };
  if (!data) delete obj.data;
  res.status(code).json(obj);
};
/* eslint-disable */

/**
 * @description {下划线转换驼峰}
 * @param {要转换的下划线格式名字} name
 */
const toHump = (name) => {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
};
/**
 * @description {驼峰转换下划线}
 * @param {要转换的驼峰格式名字} name
 */
const toLine = (name) => {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * @description {处理update语句}
 * @param  {SQL中字段名字段名组成的数组，需要自行处理} fieldList
 * @param  {前端传递过来的参数组成的对象} body
 * @return {返回一个update语句中修改的那部分语句}
 */
const dealUpdateSql = (fieldList, body) => {
  const bodys = Object.entries(body);
  let str = '';
  fieldList.forEach((fieldname) => {
    bodys.forEach((item) => {
      if (fieldname === toLine(item[0])) {
        if (fieldname !== 'id' && fieldname !== 'password') {
          str += toLine(item[0]) + "='" + item[1] + "',";
        }
        if (fieldname === 'password') {
          console.log(decodeBase64(item[1]));
          str += toLine(item[0]) + "='" + toMd5(decodeBase64(item[1])) + "',";
        }
      }
    });
  });
  str = str.slice(0, -1);
  return str;
};

/**
 * @description {时间格式化}
 * @param {SQL返回的数据记录} rows
 */
const formatData = (rows) => {
  return rows.map((row) => {
    let date = moment(row.create_time).format('YYYY-MM-DD HH:mm:ss');
    return { ...row, create_time: date };
  });
};

/**
 * @description {单个时间格式化}
 * @param {时间字符串} data
 */
const parseTime = (data, format = 'YYYY-MM-DD HH:mm:ss') => {
  // console.log(moment.locale(), '当前格式化时间语言')
  return moment(data).format(format);
};

/**
 * @description {判断对象是否是空对象}
 * @param {要判断的对象} object
 */
const isEmptyObject = (object) => {
  if (Object.keys(object).length === 0) {
    return true;
  } else {
    return false;
  }
};

const limitSearch = (page, size) => {
  // 根据传递的当前页，以及每页显示多少条，计算出从第多少条开始查询
  const fromSize = (page - 1) * size;
  return [fromSize, size];
};

const formatLimitData = (opt) => {
  const { list, page, size, fromSize, total } = opt;
  if (!list || !page || !size || fromSize === undefined || total === undefined) return false;
  return { ...opt };
};

const isUndefined = (val) => {
  return val === undefined || val === '';
};

const isDate = (str) => {
  return typeof str !== 'number' && str !== null && new Date(str) != 'Invalid Date';
};

module.exports = {
  connectionPool,
  writeJson,
  formatData,
  generateToken,
  verifyToken,
  dealUpdateSql,
  parseTime,
  toHump,
  toLine,
  isEmptyObject,
  limitSearch,
  formatLimitData,
  decodeBase64,
  encodeBase64,
  toMd5,
  isUndefined,
  isDate
};
