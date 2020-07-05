const interfaces = require('os').networkInterfaces();

function getIp() {
  let IpAddress = '';
  for (let devName in interfaces) {
    interfaces[devName].forEach((ipInfo) => {
      if (ipInfo.family === 'IPv4' && ipInfo.address !== '127.0.0.1' && !ipInfo.internal) {
        IpAddress = ipInfo.address;
      }
    });
  }
  return IpAddress;
}
module.exports = getIp;
