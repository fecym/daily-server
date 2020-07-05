import { writeJson } from '../utils';
import { ERROR_MESSAGE } from '../utils/constant';
import AV from '../config/leanengine';

export const getBlogSummaryInfo = async (req, res, next) => {
  try {
    const list = await new AV.Query('Counter').find();
    const totalVisits = list.reduce((prev, cur) => {
      const count = cur._serverData.time;
      return prev + count;
    }, 0);
    writeJson(res, 200, 'ok', { totalVisits, list });
  } catch (error) {
    console.log('getBlogInfo -> error', error);
    writeJson(res, 500, ERROR_MESSAGE, null);
  }
};
