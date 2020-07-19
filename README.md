## 接口规范

api 最前面加 `/`，最后面不加

```js
// e.g.
export const API = '/api';
export const userApi = API + '/user';

// e.g.
testApi: API + '/getList';
```

## 文件服务

### 文件上传经历三步：

1. 将解析后的文件存到本地
2. 将解析后的文件上传到七牛云
3. 将文件信息写入 SQL

返回文件解析后信息

### 文件查看

- 测试服务：file-test.chengyuming.cn + 文件名。e.g.： `http://file-test.chengyuming.cn/ast-arrow-fn.jpg`

- 生产环境：files.chengyuming.cn + 文件名。e.g.：`http://files.chengyuming.cn/ast-flow-code.jpg` 有个问题，文件名字重复，不上传七牛云

- 服务器文件访问，NGINX 已配置静态服务器，访问地址：chengyuming.cn/file + 文件名 + 后缀名。e.g.：`https://chengyuming.cn/file/ast.jpg`
