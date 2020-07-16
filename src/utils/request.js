const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/transfer/file/add',
  method: 'POST',
  data: {
    hash: '468979a29f41e48378ee4dbaded01f1e392e3822',
    mtime: '2020-07-16T14:08:44.146Z',
    name: 'ast-flow.jpg',
    size: 17084,
    type: 'image/jpeg',
    transferId: '12'
  }
};

http.request(options, res => {
  console.log('res', res);
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', chunk => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});
