/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-07-06 20:29:32
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-08-18 22:15:39
 */

// import { API, userApi, consumeApi, blogApi, summaryApi, transferApi } from '../utils/constant';
export const API = '/api';
export const userApi = API + '/user';
// 消费api
export const consumeApi = API + '/consume';
// 博客统计相关API
export const blogApi = API + '/blog';
// 汇总相关
export const summaryApi = API + '/summary';
export const transferApi = API + '/transfer';
// 文件相关
export const fileApi = API + '/file';

module.exports = {
  testApi: API + '/getList',
  // 登录接口
  loginApi: userApi + '/login',
  addressApi: API + '/address',
  updateApi: userApi + '/update/userInfo',
  // 查询用户
  getAccountsApi: userApi + '/get/accounts',
  // 更新用户密码
  updatePasswordApi: userApi + '/update/password',
  // 新增用户
  createAccountApi: userApi + '/add/account',
  switchGuideApi: userApi + '/switch/guide',
  updateAvatarApi: userApi + '/update/avatar',
  getSelectNamesApi: userApi + '/get/select/names',
  testInfo: API + '/testInfo',
  // 查询消费记录
  findConsumeListApi: consumeApi + '/findConsumeList',
  // 添加消费记录
  addConsumeRecordApi: consumeApi + '/add/consumeRecord',
  // 更新消费记录
  updateConsumeRecordApi: consumeApi + '/update/consumeInfo',
  // 获取首页图表数据
  getEchartsInfoApi: consumeApi + '/get/homeEchartsInfo',
  // 当月消费统计
  getCurrentMonthStatisticsApi: consumeApi + '/get/currentMonthStatistics',
  // 每月消费汇总
  summaryMonthAmountsApi: consumeApi + '/summary/monthAmounts',
  // 博客汇总
  blogSummary: blogApi + '/summary',

  // 汇总相关 API
  blogVisit: summaryApi + '/blog/visit',
  // 消费总额
  consumeByCurrentYear: summaryApi + '/consume/current/year',
  consumeByCurrentMonth: summaryApi + '/consume/current/month',
  consumeByCurrentWeek: summaryApi + '/consume/current/week',
  // 消费记录
  consumeRecordByCurrentWeek: summaryApi + '/consume/week/record',
  // 最近七天的消费记录
  consumeRecordByLast7Day: summaryApi + '/consume/last7/record',
  // getConsumeByLast7DayRecords

  // 转账相关
  createTransferMoneyInfo: transferApi + '/create/record',
  updateTransferMoneyInfo: transferApi + '/update/record',
  getTransferMoneyInfo: transferApi + '/get/transfer/info',
  findTransferRecordsApi: transferApi + '/get/list',
  findTransferAllRecordsApi: transferApi + '/get/all/list',

  // 文件服务相关
  fileUploadApi: fileApi + '/upload',
  fileDownloadApi: fileApi + '/download',
  fileGetListApi: fileApi + '/get/list',
  fileGetApi: fileApi + '/get',
  fileDeleteApi: fileApi + '/delete'
};
