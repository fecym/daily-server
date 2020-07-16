import { writeJson } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import TransferFile from '../model/transfer-file';
// import { Op } from 'sequelize';

export const createTransferFile = async (req, res) => {
  const { name, size, mtime, type, hash, transferId: transfer_id } = req.body;
  const user_id = req.uid;
  try {
    await sequelize.sync({ alter: true });
    TransferFile.create({ user_id, name, size, mtime, type, hash, transfer_id });
    writeJson(res, 200, 'ok', true);
  } catch (e) {
    console.log('TransferMoney -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};

export const createTransferFile2 = async ({ user_id, name, size, mtime, type, hash, transfer_id }) => {
  try {
    await sequelize.sync({ alter: true });
    TransferFile.create({ user_id, name, size, mtime, type, hash, transfer_id });
    return true;
  } catch (e) {
    console.log('createTransferFile2 -> e', e);
    return false;
  }
};
