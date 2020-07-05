/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-07-18 20:25:52
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-09-22 23:26:11
 */

import {
  connectionPool,
  writeJson,
  generateToken,
  dealUpdateSql,
  parseTime,
  toHump,
  isEmptyObject,
  limitSearch,
  decodeBase64,
  toMd5
} from '../utils';

import { ERROR_MESSAGE } from '../utils/constant';

const { queryByMulti, showAllFieldName } = require('../utils/sql');
export const Login = async (req, res, next) => {
  const { username, password: pass } = req.body;
  const password = toMd5(decodeBase64(pass));
  try {
    const data = await connectionPool(queryByMulti, [
      'user',
      'username',
      username,
      'password',
      password
    ]);
    if (data && data.length) {
      const response = data[0];
      response.roles = [response.role];
      // 生成随机token
      response.token = generateToken({
        uid: response.id,
        username: response.username
      });
      response.update_time = parseTime(response.update_time);
      response.create_time = parseTime(response.create_time);
      const result = {};
      Object.entries(response).forEach((item) => {
        result[toHump(item[0])] = item[1];
      });
      // 不返密码字段
      delete result.password;
      delete result.isDel;
      writeJson(res, 200, 'ok', result);
    } else {
      const msg = '登录失败，请检查你的账号或者密码';
      writeJson(res, 400, msg, null);
    }
  } catch (error) {
    console.log('Login -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const UpdateInfo = async (req, res, next) => {
  // if (req.username !== 'cym') return writeJson(res, 402, '你没有权限修改用户信息', null)
  // 简单权限判断
  if (req.username !== req.body.username && req.username !== 'cym') {
    return writeJson(res, 402, '权限不够', null);
  }
  // 思路：更新用户信息，有的更新有的不更新，我们需要处理成一条可用的SQL语句
  // 一查出表中得所有字段名，二根据主键update数据
  if (!req.body.id) {
    return writeJson(res, 400, '缺少用户Id', null);
  }
  try {
    const data = await connectionPool(showAllFieldName, ['user', 'daily']);
    const body = req.body;
    // 处理字段名称
    const fieldList = data.map((item) => item.Field);
    const dealData = dealUpdateSql(fieldList, body);
    const _sql = 'UPDATE user SET ' + dealData + ' WHERE id=' + body.id;
    await connectionPool(_sql);
    delete body.password;
    writeJson(res, 200, '修改成功', body);
  } catch (error) {
    console.log('UpdateInfo -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const newPass = toMd5(decodeBase64(newPassword));
    const oldPass = toMd5(decodeBase64(oldPassword));
    const selectPasswordInfoSql = `SELECT ?? FROM ?? WHERE ??=?`;
    const passwordData = await connectionPool(selectPasswordInfoSql, [
      'password',
      'user',
      'id',
      req.uid
    ]);
    const password = passwordData[0].password;
    if (oldPass !== password) {
      return writeJson(res, 400, '密码错误', null);
    }
    if (newPass === password) {
      return writeJson(res, 200, '密码未修改', { msg: '密码未修改' });
    }
    const updatePasswordSql = `UPDATE ?? SET ??=? WHERE ??=?`;
    await connectionPool(updatePasswordSql, ['user', 'password', newPass, 'id', req.uid]);
    return writeJson(res, 200, '密码更新成功', { data: true });
  } catch (error) {
    console.log('updatePassword -> error', error);
    return writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 查询用户列表
export const queryAccountsList = async (req, res, next) => {
  if (isEmptyObject(req.query)) return writeJson(res, 400, '参数不合法', null);
  const { startAt, endAt, username, realname, page, size } = req.query;
  // 判断有没有传递分页参数
  if (!page || !size) return writeJson(res, 400, '缺少分页数据', null);
  let limitArr = limitSearch(page, size);
  let totalSize = '';
  let _sql = '';
  // 判断有没有传递时间
  if (startAt && endAt) {
    totalSize = `SELECT COUNT(??) AS total FROM ?? WHERE ?? LIKE '%${username}%' AND (?? LIKE '%${realname}%' OR ?? IS NULL) AND create_time BETWEEN '${startAt}' AND '${endAt}'`;
    _sql = `SELECT * FROM ?? WHERE ?? LIKE '%${username}%' AND (?? LIKE '%${realname}%' OR ?? IS NULL) AND create_time BETWEEN '${startAt}' AND '${endAt}' ORDER BY create_time desc LIMIT ${limitArr[0]}, ${limitArr[1]}`;
  } else {
    totalSize = `SELECT COUNT(??) AS total FROM ?? WHERE ?? LIKE '%${username}%' AND (?? LIKE '%${realname}%' OR ?? IS NULL)`;
    _sql = `SELECT * FROM ?? WHERE ?? LIKE '%${username}%' AND (?? LIKE '%${realname}%' OR ?? IS NULL) ORDER BY create_time desc LIMIT ${limitArr[0]}, ${limitArr[1]}`;
  }
  const data = {};
  try {
    const ret = await connectionPool(totalSize, ['id', 'user', 'username', 'realname', 'realname']);
    // 求出总条数，然后在请求列表
    data.total = ret[0]['total'];
    const result = await connectionPool(_sql, ['user', 'username', 'realname', 'realname']);
    if (result && result.length) {
      const list = [];
      result.forEach((item) => {
        const _result = {};
        Object.entries(item).forEach((_item) => {
          if (_item[0] === 'create_time' || _item[0] === 'update_time') {
            _item[1] = parseTime(_item[1]);
          }
          _result[toHump(_item[0])] = _item[1];
          if (_item[0] === 'password' || _item[0] === 'is_del') {
            delete _result[toHump(_item[0])];
          }
          // _item[0] === 'password' ? Reflect.deleteProperty(_result, toHump(_item[0])) : undefined
          // _item[0] === 'is_del' ? Reflect.deleteProperty(_result, toHump(_item[0])) : undefined
        });
        list.push(_result);
      });
      data.page = page;
      data.size = size;
      // 从第多少条开始查的
      data.fromSize = limitArr[0];
      data.list = list;
      return writeJson(res, 200, 'ok', data);
    } else {
      writeJson(res, 200, 'ok', []);
    }
  } catch (error) {
    console.log('queryAccountsList -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const createAccount = async (req, res, next) => {
  if (req.username !== 'cym') return writeJson(res, 402, '你没有权限创建用户', null);
  const { username, realname, nickname, password } = req.body;
  if (!username || !realname || !nickname || !password)
    return writeJson(res, 400, '用户基本信息和用户密码必填', null);
  // 处理字段名
  // let fieldStr = Object.keys(req.body).map(item => toLine(item)).join(', ')
  // // 处理value
  // let valueStr = Object.values(req.body).join("', '")
  // valueStr = "'" + valueStr + "'"
  // const _sql = `INSERT INTO ?? (${fieldStr}) VALUES (${valueStr});`

  try {
    const data = await connectionPool(showAllFieldName, ['user', 'daily']);
    // 处理字段名称
    const fieldList = data.map((item) => item.Field);
    const dealData = dealUpdateSql(fieldList, req.body);
    const _sql = `INSERT INTO ?? SET ${dealData};`;
    const _data = await connectionPool(_sql, ['user']);
    writeJson(res, 200, 'ok', _data);
  } catch (error) {
    console.log('createAccount -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 登录后是否开启引导
export const switchGuideFeature = async (req, res, next) => {
  const { id, flag } = req.body;
  console.log('switchGuideFeature -> id, flag', id, flag);
  if (!id || (flag !== 0 && flag !== 1)) return writeJson(res, 400, '参数异常');
  const _sql = `UPDATE ?? SET ??=? WHERE ??=?`;
  try {
    await connectionPool(_sql, ['user', 'is_guide', flag, 'id', id]);
    writeJson(res, 200, 'ok', true);
  } catch (error) {
    console.log('switchGuideFeature -> error', error);
    writeJson(res, 200, 'ok', false);
  }
};

// module.exports = {
//   Login,
//   UpdateInfo,
//   updatePassword,
//   queryAccountsList,
//   createAccount
// }
