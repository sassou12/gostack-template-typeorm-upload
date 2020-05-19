import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const directoryTmp = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: directoryTmp,
  storage: multer.diskStorage({
    destination: directoryTmp,
    filename(_, filename, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${filename.originalname}`;
      return callback(null, fileName);
    },
  }),
};
