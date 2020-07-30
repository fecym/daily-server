/*
 * @Description:
 * @Author: chengyuming
 * @Date: 2019-07-06 20:29:32
 * @LastEditors: chengyuming
 * @LastEditTime: 2019-09-10 22:51:08
 */
// const express = require('express');
import express from 'express';
const router = express.Router();
// const api = require('./api')
import api from './api';
// import * as testHello  from '../controller/test'
// console.log(testHello.default, 'test')
// 登录，登出接口
import { Login, UpdateInfo, updatePassword, queryAccountsList, createAccount, switchGuideFeature, updateUserAvatar, getUserSelectNames } from '../controller/user';
// 消费接口类
import { getAddress, findConsumeList, addConsumeInfo, updateConsumeInfo, getAllConsumeList, currentMonthStatistics, summaryMonthAmounts } from '../controller/consume';
// 博客相关
import { getBlogSummaryInfo } from './../controller/blog';
// 汇总
import {
  getBlogVisit,
  getConsumeTotalAmountByWeek,
  getConsumeTotalAmountByMonth,
  getConsumeTotalAmountByYear,
  getConsumeRecordByCurrentWeek,
  getConsumeByLast7DayRecords
} from '../controller/summary';

// 转账
import { createRecord, updateTransferInfo, findTransferRecords, findAllTransferRecords, getTransferInfo } from '../controller/transfer-money';

// 文件相关
// import { uploadFile, getFileInfoByLocal } from '../controller/files';
import { uploadFile, getFileListByAuth, deleteFileByFileId } from '../controller/files';

// router.get(api.testApi, test)
router.post(api.loginApi, Login);
// router.get(api.loginApi, Login)
router.get(api.addressApi, getAddress);
router.post(api.updateApi, UpdateInfo);
router.post(api.updatePasswordApi, updatePassword);
router.get(api.getAccountsApi, queryAccountsList);
router.post(api.createAccountApi, createAccount);
router.post(api.switchGuideApi, switchGuideFeature);
router.post(api.updateAvatarApi, updateUserAvatar);
router.get(api.getSelectNamesApi, getUserSelectNames);

// router.post(api.testInfo, testInfo)

// 消费记录
router.get(api.findConsumeListApi, findConsumeList);
// 添加消费记录
router.post(api.addConsumeRecordApi, addConsumeInfo);
// 更新消费记录
router.post(api.updateConsumeRecordApi, updateConsumeInfo);
// 渲染首页图表
router.get(api.getEchartsInfoApi, getAllConsumeList);
// 当月统计
router.get(api.getCurrentMonthStatisticsApi, currentMonthStatistics);
// 每月消费汇总
router.get(api.summaryMonthAmountsApi, summaryMonthAmounts);
// 博客相关
router.get(api.blogSummary, getBlogSummaryInfo);

// 汇总相关
// getBlogVisit, getConsumeTotalAmountByMonth, getConsumeTotalAmountByYear
router.get(api.blogVisit, getBlogVisit);
router.get(api.consumeByCurrentMonth, getConsumeTotalAmountByMonth);
router.get(api.consumeByCurrentYear, getConsumeTotalAmountByYear);
router.get(api.consumeByCurrentWeek, getConsumeTotalAmountByWeek);
router.get(api.consumeRecordByCurrentWeek, getConsumeRecordByCurrentWeek);
router.get(api.consumeRecordByLast7Day, getConsumeByLast7DayRecords);

router.post(api.createTransferMoneyInfo, createRecord);
router.post(api.updateTransferMoneyInfo, updateTransferInfo);
router.get(api.getTransferMoneyInfo, getTransferInfo);
router.get(api.findTransferRecordsApi, findTransferRecords);
router.get(api.findTransferAllRecordsApi, findAllTransferRecords);
// router.get(api.addTransferFiles, createFile);

router.post(api.fileUploadApi, uploadFile);
router.get(api.fileGetListApi, getFileListByAuth);
router.post(api.fileDeleteApi, deleteFileByFileId);

export default router;
