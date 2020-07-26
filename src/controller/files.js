import UploadQiniu from '../config/qiniu.config';
import formidable from 'formidable';
import { fileConfig } from '../config/index';
import { writeJson, isProd, isDate, isUndefined, toHump, parseTime } from '../utils';
import { ERROR_MESSAGE, filePath } from '../utils/constant';
import { sequelize } from '../config/sequelize';
import FileModel from '../model/file';
import { Op } from 'sequelize';
import { getUserInfoById } from './user';

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
        item.url = filePath + '/' + item.name;
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
  try {
    // const isDev = req.app.get('env') === 'development';
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      hash: 'sha1',
      uploadDir: isProd ? fileConfig.PROD_PATH : fileConfig.DEV_PATH
    });

    // 前端 append 要求 files，貌似只会获取到单个
    form.parse(req, async (err, fields, { files }) => {
      // console.log('uploadFile -> fields', fields);
      if (err) {
        console.log('uploadFile -> err', err);
        return writeJson(res, 500, ERROR_MESSAGE, null);
      }
      if (!files) return writeJson(res, 400, 'error', '上传失败');
      files.url = filePath + '/' + files.name;
      // 等待七牛的上传
      const qiniuInfo = await upQiniu.upload(files.name, files.path);
      console.log('uploadFile -> qiniuInfo', qiniuInfo);
      files.qiniuHash = qiniuInfo.hash;
      files.qiniuKey = qiniuInfo.key;
      // 同步写入SQL
      const data = await createFile2({ ...files, user_id });
      writeJson(res, 200, 'ok', data);
    });
  } catch (e) {
    console.log('uploadFile -> e', e);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
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
      const { dataValues } = await FileModel.findOne({
        where: { id: { [Op.eq]: fileId } }
      });
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
