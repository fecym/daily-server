import path from 'path';
export const fileConfig = {
  DEV_PATH: path.join(__dirname, '../../..', 'upload-files'),
  PROD_PATH: path.resolve('/root/project/files')
};
