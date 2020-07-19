import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export { sequelize };

export default class FileModel extends Model {}

FileModel.init(
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
    // path
    path: DataTypes.STRING,
    url: DataTypes.STRING,
    // lastModifiedDate: DataTypes.DATE,
    lastModifiedDate: { type: DataTypes.DATE, allowNull: true },
    // mtime: { type: DataTypes.DATE, allowNull: true },
    type: DataTypes.STRING,
    hash: DataTypes.STRING
    // 外键
    // transfer_id: {
    //   type: DataTypes.INTEGER,
    //   references: {
    //     model: 'transfer_money',
    //     key: 'id'
    //   },
    //   comment: '与 transfer_money 表关联'
    // }
  },
  { sequelize, modelName: 'FileModel', tableName: 'file', timestamps: true, paranoid: true }
);
