/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-07-18 20:25:52
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-10-25 00:20:33
 */
// const { writeJson, connectionPool, isEmptyObject, toHump, toLine, dealUpdateSql, limitSearch, formatLimitData, parseTime } = require('../utils')
import fs from 'fs';
import path from 'path';
import { writeJson, connectionPool, isEmptyObject, toHump, toLine, dealUpdateSql, limitSearch, formatLimitData, parseTime } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
const SQL_TABLE_NAME = 'consume';
const PRIMARY_ID = 'id';

/* GET users listing. */
export const getAddress = (req, res, next) => {
  const address = path.join(__dirname, '../utils/guess_area.json');
  fs.readFile(address, 'utf8', (err, data) => {
    if (err) {
      console.log('getAddress -> err', err);
      writeJson(res, 500, '地址信息读取失败', null);
      throw err;
    }
    const response = JSON.parse(data).RECORDS;
    writeJson(res, 200, 'ok', response);
  });
};

// 渲染图表使用
export const getAllConsumeList = async (req, res, next) => {
  if (!req.username) return writeJson(res, 402, '未捕获到用户信息', null);
  let _sql = `SELECT * from ${SQL_TABLE_NAME} WHERE username='${req.username}'`;
  try {
    const result = await connectionPool(_sql);
    if (result && result.length) {
      const list = [];
      result.forEach(item => {
        const mapObj = {};
        Object.entries(item).forEach(val => {
          mapObj[toHump(val[0])] = val[1];
        });
        list.push(mapObj);
      });
      writeJson(res, 200, 'ok', list);
    } else {
      writeJson(res, 200, 'ok', []);
    }
  } catch (error) {
    console.log('getAllConsumeList -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const findConsumeList = async (req, res, next) => {
  if (!req.username) return writeJson(res, 402, '未捕获到用户信息', null);
  let _sql = '';
  let totalSize = '';
  // 判断有没有传递参数
  if (isEmptyObject(req.query)) return writeJson(res, 400, '参数异常', null);
  // 规定好的参数是 startAt，endAt
  const { startAt, endAt, page, size } = req.query;
  // 判断有没有传递分页参数
  if (!page || !size) return writeJson(res, 400, '缺少分页数据', null);
  let limitArr = limitSearch(page, size);
  if (startAt && endAt && page && size) {
    // 先查总条数
    totalSize = `SELECT COUNT(??) AS total from ${SQL_TABLE_NAME} WHERE username='${req.username}' AND create_time BETWEEN '${startAt}' AND '${endAt}'`;
    _sql = `SELECT * from ${SQL_TABLE_NAME} WHERE username='${req.username}' AND create_time BETWEEN '${startAt}' AND '${endAt}' ORDER BY create_time DESC LIMIT ${limitArr[0]}, ${limitArr[1]}`;
  } else {
    totalSize = `SELECT COUNT(??) AS total from ${SQL_TABLE_NAME} WHERE username='${req.username}'`;
    // limit永远写在最后
    _sql = `SELECT * FROM ${SQL_TABLE_NAME} WHERE username='${req.username}' ORDER BY create_time desc LIMIT ${limitArr[0]}, ${limitArr[1]}`;
  }
  // const data = {}
  try {
    const ret = await connectionPool(totalSize, [PRIMARY_ID]);
    // 求出总条数，然后在请求列表
    const total = ret[0]['total'];
    // 请求列表
    const result = await connectionPool(_sql);
    if (result && result.length) {
      const list = [];
      // 根据数据库返回的list集合对数据库的所有字段转驼峰命名，并且组装新的数据返给前端
      result.forEach(item => {
        const mapObj = {};
        Object.entries(item).forEach(val => {
          if (val[0] === 'create_time' || val[0] === 'update_time') {
            val[1] = parseTime(val[1]);
          }
          mapObj[toHump(val[0])] = val[1];
        });
        list.push(mapObj);
      });
      const data = formatLimitData({
        list,
        total,
        page,
        size,
        // 从第多少条开始查的
        fromSize: limitArr[0]
      });
      if (!data) return writeJson(res, 400, '参数异常', null);
      writeJson(res, 200, 'ok', data);
    } else {
      writeJson(res, 200, 'ok', []);
    }
  } catch (error) {
    console.log('findConsumeList -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 添加日常消费核心逻辑，判断完毕后调用
const addConsumeInfoCore = async (req, res) => {
  const { repastPrice, vehiclePrice, snacksPrice, transferAccounts, otherPrice, cosmeticPrice, lifePrice, tripPrice, shoppingPrice } = req.body;
  // 转驼峰传过去
  let fieldStr = Object.keys(req.body)
    .map(item => toLine(item))
    .join(', ');
  // 处理总消费
  fieldStr = fieldStr + ', total_amount';
  let valueStr = Object.values(req.body).join("', '");
  // 处理总消费
  let total_amount =
    Number(vehiclePrice) +
    Number(snacksPrice) +
    Number(transferAccounts) +
    Number(otherPrice) +
    Number(repastPrice) +
    Number(tripPrice) +
    Number(shoppingPrice) +
    Number(cosmeticPrice) +
    Number(lifePrice);
  // 值最后加上总额
  valueStr = "'" + valueStr + "', '" + total_amount + "'";
  const _sql = `INSERT INTO ?? (${fieldStr}) VALUES (${valueStr});`;
  try {
    const data = await connectionPool(_sql, [`${SQL_TABLE_NAME}`]);
    writeJson(res, 200, 'ok', data);
  } catch (error) {
    console.log('addConsumeInfoCore -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 用户当天有没有创建过订单
const createIntradayConsume = async (req, res, username) => {
  // 查所有当天有没有新建过
  let queryNewConsumeHistorySql = `SELECT create_time from ${SQL_TABLE_NAME} WHERE username=? AND TO_DAYS(create_time) = TO_DAYS(NOW());`;
  try {
    // 当天的第一时间和最后时间
    const data = await connectionPool(queryNewConsumeHistorySql, [username]);
    console.log(data, '用户单天有没有创建过订单');
    if (!data.length) {
      addConsumeInfoCore(req, res);
    } else {
      return writeJson(res, 400, '今天您已经创建过订单了', null);
    }
  } catch (error) {
    console.log('createIntradayConsume -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const addConsumeInfo = async (req, res, next) => {
  // 防御性判断
  const { createTime, username, repastPrice } = req.body;
  if (!createTime || !username || !repastPrice) {
    return writeJson(res, 400, '参数校验失败', null);
  }

  // 该用户有没有创建过订单
  let queryUserCreateRecordHistorySql = `SELECT username from ${SQL_TABLE_NAME} WHERE username=?`;
  try {
    const data = await connectionPool(queryUserCreateRecordHistorySql, [username]);
    if (data.length) {
      console.log('用户创建过订单');
      createIntradayConsume(req, res, username);
    } else {
      console.log('用户没有创建过订单');
      addConsumeInfoCore(req, res);
    }
  } catch (error) {
    console.log('addConsumeInfo -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const updateConsumeInfo = async (req, res, next) => {
  const { createTime, username, repastPrice, id, vehiclePrice, snacksPrice, transferAccounts, otherPrice, cosmeticPrice, lifePrice, tripPrice, shoppingPrice } = req.body;
  if (!createTime || !username || !repastPrice || !id) {
    return writeJson(res, 400, '参数校验失败', null);
  }
  const fieldList = Object.keys(req.body).map(item => toLine(item));
  const body = {};
  Object.entries(req.body).forEach(item => (body[toLine(item[0])] = item[1]));
  // 处理字段名
  let dealData = dealUpdateSql(fieldList, body);
  // 计算当天总消费
  let total_amount =
    Number(vehiclePrice) +
    Number(snacksPrice) +
    Number(transferAccounts) +
    Number(otherPrice) +
    Number(repastPrice) +
    Number(tripPrice) +
    Number(shoppingPrice) +
    Number(cosmeticPrice) +
    Number(lifePrice);
  dealData = `${dealData}, total_amount=${total_amount}`;
  const _sql = `UPDATE ?? SET ${dealData} WHERE ?? = ?`;
  try {
    const data = await connectionPool(_sql, [SQL_TABLE_NAME, PRIMARY_ID, id]);
    writeJson(res, 200, 'ok', data);
  } catch (error) {
    console.log('updateConsumeInfo -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 当月统计
export const currentMonthStatistics = async (req, res, next) => {
  // const totalNum = `SELECT COUNT(??) AS total FROM ?? WHERE DATE_FORMAT(??, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m');`
  const _sql = `SELECT * FROM ?? WHERE ??=? AND DATE_FORMAT(??, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m');`;
  // const _sql = `SELECT * FROM ?? WHERE ??=? AND LEFT(??, 7) = '2019-10'`
  try {
    const list = await connectionPool(_sql, [`${SQL_TABLE_NAME}`, 'username', req.username, 'create_time']);
    const statistics = {
      vehicle_price: 0,
      drinks_price: 0,
      snacks_price: 0,
      transfer_accounts: 0,
      life_price: 0,
      cosmetic_price: 0,
      other_price: 0,
      trip_price: 0,
      shopping_price: 0,
      repast_price: 0,
      total_amount: 0
    };
    // 计算列表数据
    list.forEach(item => {
      Object.keys(statistics).forEach(key => {
        statistics[key] += (item[key] * 100).toFixed(2) / 100;
      });
    });
    // 计算统计数据
    Object.keys(statistics).forEach(key => {
      // 属性名称转大写
      const val = statistics[key];
      statistics[toHump(key)] = val;
      Reflect.deleteProperty(statistics, key);
    });
    writeJson(res, 200, 'ok', { list, statistics });
  } catch (error) {
    console.log('currentMonthStatistics -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 汇总每个月的消费总额
export const summaryMonthAmounts = async (req, res, next) => {
  const _sql = `SELECT monthly_fee, SUM( ?? ) AS amount FROM ( SELECT LEFT ( ??, 7 ) AS monthly_fee, username, total_amount FROM ${SQL_TABLE_NAME} WHERE username=? ) AS consume_summary GROUP BY monthly_fee;`;
  try {
    const list = await connectionPool(_sql, ['total_amount', 'create_time', req.username]);
    const result = list.map(item => {
      const obj = {};
      Object.keys(item).forEach(key => {
        obj[toHump(key)] = item[key];
      });
      return obj;
    });
    writeJson(res, 200, 'ok', result);
  } catch (error) {
    console.log('summaryMonthAmounts -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// module.exports = {
//   getAddress,
//   findConsumeList,
//   addConsumeInfo,
//   updateConsumeInfo,
//   getAllConsumeList,
//   currentMonthStatistics,
//   summaryMonthAmounts
// }
