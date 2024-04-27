const http = require('http');
const serialization = require('../util/serialization');

const comm = {};

comm.send = (message, remote, callback) => {
  if (! message instanceof Array) {
    throw new Error('The message must be an array!');
  }

  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: `/${remote.service}/${remote.method}`,
    method: 'PUT',
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (callback) {
        callback(...serialization.deserialize(data));
      }
    });
  });

  req.on('error', (error) => {
    if (error) {
      console.log('HERE IS THE ERROR', error);
      callback(new Error('There was an issue with connection!'), null);
    }
  });

  req.write(serialization.serialize(message));
  req.end();
};

module.exports = comm;
