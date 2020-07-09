import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export { sequelize };

export default class TransferMoney extends Model {}

TransferMoney.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.INTEGER,
    transfer_name: DataTypes.STRING,
    transfer_time: DataTypes.DATE,
    repayment_time: { type: DataTypes.DATE, allowNull: true },
    type: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    // 转账方式：1：微信；2：支付宝；3：银行卡
    transfer_mode: { type: DataTypes.INTEGER, hasComment: { comment: '转账方式：1：微信；2：支付宝；3：银行卡' } },
    // TODO： 文件这个问题，随后再说
    // files: DataTypes.ARRAY,
    remake: DataTypes.STRING
  },
  { sequelize, modelName: 'transfer_money', tableName: 'transfer_money' }
);
