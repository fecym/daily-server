import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export { sequelize };

export default class TransferFile extends Model {}

TransferFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.INTEGER,
    // 文件名
    name: DataTypes.STRING,
    // 文件大小
    size: DataTypes.INTEGER,
    mtime: { type: DataTypes.DATE, allowNull: true },
    type: DataTypes.STRING,
    hash: DataTypes.STRING,
    // 外键
    transfer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'transfer_money',
        key: 'id'
      },
      comment: '与 transfer_money 表关联'
    }
  },
  { sequelize, modelName: 'TransferFile', tableName: 'transfer_file', timestamps: true, paranoid: true }
);
