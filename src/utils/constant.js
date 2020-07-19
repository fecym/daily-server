import { loginApi, blogSummary } from '../routes/api';
export const ERROR_MESSAGE = '服务器异常';
export const WHITE_LIST = [loginApi, blogSummary];

// 表名
export const TABLE_NAME = {
  user: 'user',
  consume: 'consume',
  dailyTask: 'daily_task'
};

export const weekMap = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六'
};
export const weekMapEn = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat'
};
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

// consume表字段
export const consumeAmountField = [
  'repast_price',
  'vehicle_price',
  'drinks_price',
  'snacks_price',
  'transfer_accounts',
  'life_price',
  'cosmetic_price',
  'other_price',
  'total_amount',
  'trip_price',
  'shopping_price'
];
export const consumeAmountFieldStr = consumeAmountField.join(',');

export const isProd = process.env.NODE_ENV === 'production';

export const filePath = isProd ? 'http://files.chengyuming.cn' : 'http://file-test.chengyuming.cn';
