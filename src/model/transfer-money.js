import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export { sequelize };

export default class TransferMoney extends Model {}

TransferMoney.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    user_id: DataTypes.INTEGER,
    transfer_name: DataTypes.STRING,
    transfer_time: DataTypes.DATE,
    repayment_time: DataTypes.DATE,
    type: DataTypes.INTEGER,
    amount: DataTypes.INTEGER
  },
  { sequelize, modelName: 'transfer_money', tableName: 'transfer_money' }
);

// (async () => {
//   try {
//     await sequelize.sync({ force: true });
//     const jane = await TransferMoney.create({
//       id: 2,
//       user_id: 3,
//       transfer_name: 'cym',
//       transfer_time: new Date('2020-07-04'),
//       repayment_time: new Date('2020-07-04'),
//       type: 0,
//       amount: 1000,
//     });
//     console.log(jane.toJSON());
//   } catch (e) {
//     console.log('TransferMoney -> e', e);
//   }
// })();
