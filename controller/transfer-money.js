import { writeJson, connectionPool, toHump, parseTime } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import TransferMoney from '../model/transfer-money';

export const createRecord = async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    TransferMoney.create({
      id: 3,
      user_id: 4,
      transfer_name: 'fecym',
      transfer_time: new Date('2020-07-05'),
      repayment_time: new Date('2020-07-05'),
      type: 0,
      amount: 12000,
    });
    writeJson(res, 200, 'ok', true);
  } catch (e) {
    console.log('TransferMoney -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const findTransferRecords = async (req, res) => {
  try {
    // await sequelize.sync({ alter: true })
    const r = await TransferMoney.findAll();
    console.log('findTransferRecords -> r', r);
    writeJson(res, 200, 'ok', r);
  } catch (e) {
    console.log('findTransferRecords -> e', e);
  }
};
