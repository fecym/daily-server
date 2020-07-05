// 首页汇总接口
import { writeJson, connectionPool, toHump, parseTime } from '../utils';
import { ERROR_MESSAGE, TABLE_NAME, weekMap, weekMapEn, consumeAmountFieldStr } from '../utils/constant';
import AV from '../config/leanengine';
import moment from 'moment';

// 博客访问量汇总
export const getBlogVisit = async (req, res) => {
  try {
    const list = await new AV.Query('Counter').find();
    const totalVisits = list.reduce((prev, cur) => {
      const count = cur._serverData.time;
      return prev + count;
    }, 0);
    writeJson(res, 200, 'ok', { totalVisits });
  } catch (error) {
    console.log('getBlogInfo -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本周消费
export const getConsumeTotalAmountByWeek = async (req, res) => {
  const _sql = `
    SELECT
      SUM(??) AS totalAmount
    FROM
      ${TABLE_NAME.consume}
    WHERE
      WEEKOFYEAR(
        DATE_FORMAT(??, '%Y-%m-%d')
      ) = WEEKOFYEAR(NOW())
    AND user_id = ?;
  `;
  try {
    const result = await connectionPool(_sql, ['total_amount', 'create_time', req.uid]);
    writeJson(res, 200, 'ok', result[0]);
  } catch (error) {
    console.log('getConsumeTotalAmountByYear -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本年消费
export const getConsumeTotalAmountByYear = async (req, res) => {
  const _sql = `
    SELECT
      SUM(??) as totalAmount
    FROM
      ${TABLE_NAME.consume}
    WHERE
      YEAR (??) = YEAR (NOW())
    AND username = ?;
  `;
  try {
    const result = await connectionPool(_sql, ['total_amount', 'create_time', req.username]);
    writeJson(res, 200, 'ok', result[0]);
  } catch (error) {
    console.log('getConsumeTotalAmountByYear -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本年消费
export const getConsumeTotalAmountByMonth = async (req, res) => {
  const _sql = `
    SELECT
      SUM(??) AS totalAmount
    FROM
    ${TABLE_NAME.consume}
    WHERE
      username = ?
    AND DATE_FORMAT(??, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m')
  `;
  try {
    const result = await connectionPool(_sql, ['total_amount', req.username, 'create_time']);
    writeJson(res, 200, 'ok', result[0]);
  } catch (error) {
    console.log('getConsumeTotalAmountByYear -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本年消费统计
export const getConsumeByYear = async (req, res) => {
  const _sql = `
    SELECT
      year_fee,
      SUM(??) AS amount
    FROM
      (
        SELECT
          LEFT (??, 4) AS year_fee,
          ??,
        FROM
          ${TABLE_NAME.consume}
        WHERE
          username = ?
      ) AS year_summary
    GROUP BY
      year_fee
  `;
  try {
    const list = await connectionPool(_sql, ['total_amount', 'create_time', 'total_amount', req.username]);
    const result = list.map((item) => {
      const obj = {};
      Object.keys(item).forEach((key) => {
        obj[toHump(key)] = item[key];
      });
      return obj;
    });
    writeJson(res, 200, 'ok', result);
  } catch (error) {
    console.log('getConsumeByYear -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本月消费统计
export const getConsumeByMonth = async (req, res, next) => {
  const _sql = `
    SELECT
      monthly_fee,
      SUM(? ?) AS amount
    FROM
      (
        SELECT
          LEFT (? ?, 7) AS monthly_fee,
          username,
          total_amount
        FROM
        ${TABLE_NAME.consume}
        WHERE
          username = ?
      ) AS consume_summary
    GROUP BY
      monthly_fee;
  `;
  try {
    const list = await connectionPool(_sql, ['total_amount', 'create_time', req.username]);
    const result = list.map((item) => {
      const obj = {};
      Object.keys(item).forEach((key) => {
        obj[toHump(key)] = item[key];
      });
      return obj;
    });
    writeJson(res, 200, 'ok', result);
  } catch (error) {
    console.log('getConsumeByMonth -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 本周消费记录
export const getConsumeRecordByCurrentWeek = async (req, res) => {
  // const _sql = `
  //   SELECT
  //     *
  //   FROM
  //     ${TABLE_NAME.consume}
  //   WHERE
  //     YEARWEEK(
  //       date_format(??, '%Y-%m-%d'),
  //       1
  //     ) = YEARWEEK(NOW(), 1)
  //   AND user_id = ?;
  // `
  const _sql = `
    SELECT
      *
    FROM
      ${TABLE_NAME.consume}
    WHERE
      WEEKOFYEAR(
        DATE_FORMAT(??, '%Y-%m-%d')
      ) = WEEKOFYEAR(NOW())
    AND user_id = ?;
  `;
  try {
    const ret = await connectionPool(_sql, ['create_time', req.uid]);
    const result = ret.map((item) => {
      const week = moment(item.create_time).format('d');
      const mapObj = {};
      Object.entries(item).forEach((val) => {
        if (val[0] === 'create_time' || val[0] === 'update_time') {
          val[1] = parseTime(val[1]);
        }
        mapObj[toHump(val[0])] = val[1];
      });
      return {
        ...mapObj,
        week,
        weekStr: weekMap[week],
        weekEn: weekMapEn[week]
      };
    });
    writeJson(res, 200, 'ok', result);
  } catch (error) {
    console.log('getConsumeByWeek -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

// 近七天消费记录
export const getConsumeByLast7DayRecords = async (req, res) => {
  const _sql = `
    SELECT
      user_id, username, create_time, ${consumeAmountFieldStr}
    FROM
      ${TABLE_NAME.consume}
    WHERE
      DATE_SUB(CURDATE(), INTERVAL 7 DAY) < DATE(??)
    AND user_id = 2;
  `;
  try {
    const ret = await connectionPool(_sql, ['create_time', req.uid]);
    const result = ret.map((item) => {
      const week = moment(item.create_time).format('d');
      const mapObj = {};
      Object.entries(item).forEach((val) => {
        if (val[0] === 'create_time' || val[0] === 'update_time') {
          val[1] = parseTime(val[1]);
        }
        mapObj[toHump(val[0])] = val[1];
      });
      return {
        ...mapObj,
        week,
        weekStr: weekMap[week],
        weekEn: weekMapEn[week]
      };
    });
    writeJson(res, 200, 'ok', result.reverse());
  } catch (error) {
    console.log('getConsumeByWeek -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};
