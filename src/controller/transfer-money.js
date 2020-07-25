import { writeJson, isUndefined, toHump, isDate, parseTime } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import TransferMoney from '../model/transfer-money';
import { Op } from 'sequelize';
import { getFileInfoById } from './files';
export const createRecord = async (req, res) => {
  const { repaymentTime, transferTime: transfer_time, amount, transferName: transfer_name, type, transferMode: transfer_mode, remake, fileIds } = req.body;
  const user_id = req.uid;
  try {
    await sequelize.sync({ alter: true });
    // await sequelize.sync();
    const result = await TransferMoney.create({
      user_id,
      transfer_name,
      transfer_time,
      transfer_mode,
      type,
      amount,
      fileIds,
      remake,
      repayment_time: type === 1 ? transfer_time : repaymentTime || null
    });
    writeJson(res, 200, 'ok', result);
  } catch (e) {
    console.log('TransferMoney -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const updateTransferInfo = async (req, res) => {
  const { id, repaymentTime, transferTime, amount, transferName, type, transferMode, fileIds, remake } = req.body;

  try {
    TransferMoney.update(
      {
        user_id: req.uid,
        transfer_name: transferName,
        transfer_time: transferTime,
        repayment_time: repaymentTime,
        transfer_mode: transferMode,
        type,
        amount,
        fileIds,
        remake
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
    Object.entries(dataValues).forEach(val => {
      if (isDate(val[1])) {
        val[1] = parseTime(val[1]);
      }
      r[toHump(val[0])] = val[1];
    });
    const fileIds = JSON.parse(r.fileIds);
    if (fileIds) {
      console.log('getTransferInfo -> fileIds', fileIds);
      const fileListPromises = fileIds.map(id => getFileInfoById(id));
      r.fileList = await Promise.all(fileListPromises);
    }
    // console.log("getTransferInfo -> fileList", fileListPromises)
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

    Object.keys(where).forEach(key => {
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
      Object.entries(dataValues).forEach(val => {
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
    writeJson(res, 500, ERROR_MESSAGE, null);
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

    Object.keys(where).forEach(key => {
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
      Object.entries(dataValues).forEach(val => {
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
