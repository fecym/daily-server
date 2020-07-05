import { verifyToken, writeJson } from '../utils'
// 路由白名单，不需要做token校验的，登陆和注册
import { WHITE_LIST } from '../utils/constant'

export default (req, res, next) => {
  if (WHITE_LIST.some(u => u === req.url)) {
    return next()
  } else {
    const authorization = req.headers['authorization']
    const result = verifyToken(authorization)
    if (!authorization) {
      return writeJson(res, 401, '未捕获到您的token', null)
    } else if (result.name && result.name.includes('Error')) {
      return writeJson(res, 401, 'token校验失败', null)
    } else {
      // 向后传递消息
      req.uid = verifyToken(authorization)['uid']
      req.username = verifyToken(authorization)['username']
      // 查一次库，确保该 token 用户存在
      return next()
    }
  }
}