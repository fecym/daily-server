import UploadQiniu from '../config/qiniu.config';
import formidable from 'formidable';
import { fileConfig } from '../config/index';
import { writeJson, isProd, isDate, isUndefined, toHump, parseTime } from '../utils/index';
import { ERROR_MESSAGE, FILE_QINIU_CDN } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import FileModel from '../model/file';
import { Op } from 'sequelize';
import { getUserInfoById } from './user';
import fs from 'fs';
import fsPath from 'path';

const bucket = isProd ? 'daily-files' : 'test-file-service';
const upQiniu = new UploadQiniu({ bucket });

/**
 * 文件写入SQL，返回文件写入SQL后的信息，对内服务
 * @param {*} params
 */
export const createFile2 = ({ user_id, name, size, lastModifiedDate, path, url, type, hash, qiniuHash, qiniuKey }) => {
  return new Promise(async (resole, reject) => {
    try {
      await sequelize.sync({ alter: true });
      // await sequelize.sync();
      const { dataValues } = await FileModel.create({ user_id, name, size, lastModifiedDate, path, url, type, hash, qiniuHash, qiniuKey });
      delete dataValues.path;
      return resole(dataValues);
    } catch (e) {
      return reject(e);
    }
  });
};

/**
 * TODO: 备用
 */
export async function uploadFile2(req, res) {
  const user_id = req.uid;
  console.log('uploadFile -> user_id', user_id);

  try {
    // const isDev = req.app.get('env') === 'development';
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      hash: 'sha1',
      uploadDir: isProd ? fileConfig.PROD_PATH : fileConfig.DEV_PATH
    });

    // 前端 append 要求 files
    form.parse(req, async (err, fields, { files }) => {
      console.log('uploadFile -> files', files);
      // console.log('uploadFile -> fields', fields);
      if (err) return writeJson(res, 500, ERROR_MESSAGE, null);
      if (!files) return writeJson(res, 400, 'error', '上传失败');
      const file = Array.isArray(files) ? files : [files];
      const qiniuPromises = [];
      const sqlPromises = [];
      file.forEach(item => {
        item.url = FILE_QINIU_CDN + '/' + item.name;
        // 写入SQL
        const sqlFile = createFile2({ ...item, user_id });
        const fileQiniu = upQiniu.upload(item.name, item.path);
        qiniuPromises.push(fileQiniu);
        sqlPromises.push(sqlFile);
      });
      // 异步写入SQL，上传七牛
      Promise.all(qiniuPromises);
      const rets = await Promise.all(sqlPromises);
      const data = rets.map(file => {
        console.log('uploadFile -> file', file);
        // 删除 path 属性，不给前端返回
        delete file.path;
        return file;
      });
      // console.log("uploadFile -> data", data)
      writeJson(res, 200, 'ok', data);
    });
  } catch (e) {
    console.log('uploadFile -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
}

/**
 * 上传文件分三步，此为一个事务
 * 1：将解析后的文件存到本地
 * 2：将解析后的文件上传到七牛云
 * 3：将文件信息写入SQL
 * ps：等到文件与
 * @param {*} req
 * @param {*} res
 */
export async function uploadFile(req, res) {
  const user_id = req.uid;
  // const isDev = req.app.get('env') === 'development';
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    hash: 'sha1',
    uploadDir: isProd ? fileConfig.PROD_PATH : fileConfig.DEV_PATH
  });

  // 前端 append 要求 files，貌似只会获取到单个
  form.parse(req, async (err, fields, { files }) => {
    const fileLocalPath = fsPath.resolve(files.path);
    try {
      if (err) return writeJson(res, 500, ERROR_MESSAGE, null);
      if (!files) return writeJson(res, 400, 'error', '上传失败');
      // console.log('uploadFile -> files', files);
      // 根据文件生成的hash判断该文件是否上传过，如果上传过，则直接返回该文件，删除上传的文件，不在写入数据库，防止太多重复文件
      const beforeFile = await getFileInfoByFileHash(files.hash);
      console.log('uploadFile -> beforeFile', beforeFile);
      if (beforeFile) {
        // 返回查询到的文件，然后删除刚刚上传的文件
        deleteLocalFile(fileLocalPath);
        return writeJson(res, 200, 'ok', beforeFile);
      }
      files.url = FILE_QINIU_CDN + '/' + files.name;
      // 等待七牛的上传
      const { hash: qiniuHash, key: qiniuKey } = await upQiniu.upload(files.name, files.path);
      if (!qiniuHash || !qiniuKey) return writeJson(res, 400, 'error', '上传七牛失败');
      files.qiniuHash = qiniuHash;
      files.qiniuKey = qiniuKey;
      // 同步写入SQL
      const data = await createFile2({ ...files, user_id });
      writeJson(res, 200, 'ok', data);
    } catch (e) {
      console.log('uploadFile -> e', e);
      deleteLocalFile(fileLocalPath);
      if (e.info && e.info.statusCode) {
        const { data, statusCode } = e.info;
        return writeJson(res, statusCode, data.error, null);
      }
      writeJson(res, 500, ERROR_MESSAGE, null);
    }
  });
}

export function deleteLocalFile(filePath) {
  fs.unlink(filePath, err => {
    if (err) {
      console.log('uploadFile -> err -> 重复文件删除失败', err);
    } else {
      console.log('uploadFile -> err -> 重复文件删除成功');
    }
  });
}
/**
 * 内部使用：根据hash查询文件是否创建过
 * @param {*} hash
 */
export function getFileInfoByFileHash(hash) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await FileModel.findOne({ where: { hash: { [Op.eq]: hash } } });
      if (!result) {
        // 没有查到文件，继续后面的上传文件逻辑
        return resolve(false);
      }
      return resolve(result.dataValues);
    } catch (e) {
      console.log('getFileInfoByFileHash -> e', e);
      reject(e);
    }
  });
}

export async function getFileInfoByQiniu(req, res) {
  try {
    const { filename } = req;
    const data = await upQiniu.getFileInfo(filename);
    writeJson(res, 200, 'ok', data);
  } catch (e) {
    console.log('getFileInfoByQiniu -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
}

export async function getFileListByAuth(req, res) {
  try {
    let { name, createAt, userId, page = 1, size = 5 } = req.query;
    const userInfo = await getUserInfoById(req.uid);
    if (Number(userInfo.role) !== 2) {
      userId = req.uid;
    }
    const where = {
      name: {
        [Op.like]: `%${name}%`
      },
      createAt: {
        [Op.eq]: createAt
      }
    };

    Object.keys(where).forEach(key => {
      console.log('getFileListByAuth -> req.query[key]', key, req.query[key]);
      if (isUndefined(req.query[key])) {
        delete where[key];
      }
    });
    userId &&
      (where.user_id = {
        [Op.eq]: userId
      });
    console.log('getFileListByAuth -> where', where);

    const otherConf = {
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * size,
      limit: Number(size)
    };

    const result = await FileModel.findAll({ where, ...otherConf });
    const list = result.map(({ dataValues }) => {
      const map = {};
      Object.entries(dataValues).forEach(val => {
        if (isDate(val[1])) {
          val[1] = parseTime(val[1]);
        }
        map[toHump(val[0])] = val[1];
      });
      return map;
    });
    const total = await FileModel.count({ where, ...otherConf });
    writeJson(res, 200, 'ok', { list, size, page, total });
  } catch (e) {
    console.log('getFileListByAuth -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
}

/**
 * 内部使用
 * @param {*} fileId
 */
export function getFileInfoById(fileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileData = await FileModel.findOne({
        where: { id: { [Op.eq]: fileId } }
      });
      if (!fileData) return resolve(fileData);
      const { dataValues } = fileData;
      const r = {};
      Object.entries(dataValues).forEach(val => {
        if (isDate(val[1])) {
          val[1] = parseTime(val[1]);
        }
        r[toHump(val[0])] = val[1];
      });
      delete r.path;
      return resolve(r);
    } catch (e) {
      console.log('getFileInfoById -> e', e);
      reject(e);
    }
  });
}

/**
 * 文件删除：真删逻辑
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export async function deleteFileByFileId(req, res, next) {
  // 文件删除：1. 删除本地；2. 删除sql；3. 删除七牛
  // TODO: 功能未完善
  const { id } = req.query;
  try {
    const deletedFile = await FileModel.destroy({ where: { id } });
    console.log('deleteFileByFileId -> deletedFile', deletedFile);
    writeJson(res, 200, 'ok', { ...deletedFile });
  } catch (e) {
    console.log('deleteFileByFileId -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
}
