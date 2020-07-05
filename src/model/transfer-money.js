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
    amount: DataTypes.INTEGER
  },
  { sequelize, modelName: 'transfer_money', tableName: 'transfer_money' }
);
