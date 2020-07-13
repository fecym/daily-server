const qiniu = require('qiniu');
const accessKey = 'OautsMKxZckNNUZJv1z3__8s1agvxTgvGLkvPru8';
const secretKey = 'Wh3MBq1_24t-b_OfvP1nYVTBSdfpp7rqkC-OgM2d';
// test-file-service
// const bucket = 'daily-files'
export default class Uploader {
  constructor(options = {}) {
    const { bucket = 'daily-files' } = options;
    // 定义鉴权对象mac，文档有
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    // 简单上传的凭证
    const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket });
    this.uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    this.formUploader = new qiniu.form_up.FormUploader(config);
    this.putExtra = new qiniu.form_up.PutExtra();
  }
  /**
   * 上传至七牛
   * @param {*} filename 上传后文件的名字
   * @param {*} realPath 在服务上的真实地址
   */
  upload(filename, realPath) {
    return new Promise((resolve, reject) => {
      this.formUploader.putFile(this.uploadToken, filename, realPath, this.putExtra, (err, body) => {
        err ? reject(err) : resolve(body);
      });
    });
  }
  /**
   * 生成下载链接
   * @param {*} fileUrl 文件的私有空间的地址
   */
  download(fileUrl) {
    const policy = new qiniu.rs.GetPolicy();
    return policy.makeRequest(fileUrl);
  }
}
