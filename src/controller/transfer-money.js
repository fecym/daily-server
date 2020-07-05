import { writeJson, isUndefined, toHump, isDate, parseTime } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import TransferMoney from '../model/transfer-money';
import { Op } from 'sequelize';

export const createRecord = async (req, res) => {
  const { repaymentTime, transferTime, amount, transferName, type } = req.body;

  try {
    await sequelize.sync({ alter: true });
    TransferMoney.create({
      user_id: req.uid,
      transfer_name: transferName,
      transfer_time: transferTime,
      repayment_time: type === 1 ? transferTime : repaymentTime || null,
      type,
      amount
    });
    writeJson(res, 200, 'ok', true);
  } catch (e) {
    console.log('TransferMoney -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const updateTransferInfo = async (req, res) => {
  const { id, repaymentTime, transferTime, amount, transferName, type } = req.body;

  try {
    TransferMoney.update(
      {
        user_id: req.uid,
        transfer_name: transferName,
        transfer_time: transferTime,
        repayment_time: repaymentTime,
        type,
        amount
      },
      { where: { id } }
    );
    writeJson(res, 200, 'ok', true);
  } catch (e) {
    console.log('TransferMoney -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const getTransferInfo = async (req, res) => {
  const { id } = req.query;
  try {
    const { dataValues } = await TransferMoney.findOne({
      where: {
        id: { [Op.eq]: id }
      }
    });
    const r = {};
    Object.entries(dataValues).forEach((val) => {
      if (isDate(val[1])) {
        val[1] = parseTime(val[1]);
      }
      r[toHump(val[0])] = val[1];
    });
    writeJson(res, 200, 'ok', r);
  } catch (e) {
    console.log('getTransferInfo -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const findTransferRecords = async (req, res) => {
  try {
    const { repaymentTime, transferTime, amount, transferName, type, page = 1, size = 5 } = req.query;

    const where = {
      transfer_name: {
        [Op.like]: `%${transferName}%`
      },
      amount: {
        [Op.lte]: amount
      },
      type: {
        [Op.eq]: type
      },
      transfer_time: {
        [Op.eq]: transferTime
      },
      repayment_time: {
        [Op.eq]: repaymentTime
      }
    };

    Object.keys(where).forEach((key) => {
      if (isUndefined(req.query[toHump(key)])) {
        delete where[key];
      }
    });
    where.user_id = {
      [Op.eq]: req.uid
    };
    const otherConf = {
      order: [['transfer_time', 'DESC']],
      offset: (page - 1) * size,
      limit: Number(size)
    };
    const result = await TransferMoney.findAll({ where, ...otherConf });
    const list = result.map(({ dataValues }) => {
      const map = {};
      Object.entries(dataValues).forEach((val) => {
        if (isDate(val[1])) {
          val[1] = parseTime(val[1]);
        }
        map[toHump(val[0])] = val[1];
      });
      return map;
    });
    const total = await TransferMoney.count({ where, ...otherConf });
    writeJson(res, 200, 'ok', { list, size, page, total });
  } catch (e) {
    console.log('findTransferRecords -> e', e);
  }
};

export const findAllTransferRecords = async (req, res) => {
  try {
    const { repaymentTime, transferTime, amount, transferName, type } = req.query;

    const where = {
      transfer_name: {
        [Op.like]: `%${transferName}%`
      },
      amount: {
        [Op.lte]: amount
      },
      type: {
        [Op.eq]: type
      },
      transfer_time: {
        [Op.eq]: transferTime
      },
      repayment_time: {
        [Op.eq]: repaymentTime
      }
    };

    Object.keys(where).forEach((key) => {
      if (isUndefined(req.query[toHump(key)])) {
        delete where[key];
      }
    });

    where.user_id = {
      [Op.eq]: req.uid
    };

    const result = await TransferMoney.findAll({ where, order: [['transfer_time', 'DESC']] });
    const list = result.map(({ dataValues }) => {
      const map = {};
      Object.entries(dataValues).forEach((val) => {
        if (isDate(val[1])) {
          val[1] = parseTime(val[1]);
        }
        map[toHump(val[0])] = val[1];
      });
      return map;
    });
    writeJson(res, 200, 'ok', list);
  } catch (e) {
    console.log('findTransferRecords -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};
