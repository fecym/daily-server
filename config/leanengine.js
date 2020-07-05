const APP_ID = 'to012rhNxJibimms3TuuGA6d-gzGzoHsz'
const APP_KEY = 'VUz3rutrxvDjziwDisWL6DrT'
const MasterKey = 'tJNGrCQTaVocrFz9UGDofOXv'

import AV from 'leanengine'

AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  serverURL: 'blog-api.chengyuming.cn',
  masterKey: MasterKey
})

export default AV