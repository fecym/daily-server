import Uploader from '../config/qiniu.config';
import formidable from 'formidable';
import { fileConfig } from '../config/index';
import { writeJson } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
console.log('Uploader', Uploader);

const uploader = new Uploader();

export async function uploadFile(req, res) {
  // console.log('uploadFile -> req', req);
  try {
    const isDev = req.app.get('env') === 'development';
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      hash: 'sha1',
      uploadDir: isDev ? fileConfig.DEV_PATH : fileConfig.PROD_PATH
    });

    // 前端 append 要求 files
    form.parse(req, async (err, fields, { files }) => {
      console.log('uploadFile -> fields', fields);
      if (err) return writeJson(res, 500, ERROR_MESSAGE, null);
      if (!files) return writeJson(res, 400, 'error', '上传失败');
      const file = Array.isArray(files) ? files : [files];
      const promises = file.map(item => {
        const tmp = { ...item };
        // 删除 path 属性，不给前端返回
        delete item.path;
        return uploader.upload(tmp.name, tmp.path);
      });
      // 上传七牛
      const uploadQiniu = await Promise.all(promises);
      console.log('uploadFile -> uploadQiniu', uploadQiniu);
      writeJson(res, 200, 'ok', file);
    });
  } catch (e) {
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
}
