const id = require('../util/id');
const wire = require('../util/wire');
const serialization = require('../util/serialization');
const {spawn} = require('node:child_process');
const path = require('path');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() {};

  if (configuration in global.nodeConfig) {
    callback(null, global.nodeConfig[configuration]);
  } else if (configuration in moreStatus) {
    callback(null, moreStatus[configuration]);
  } else if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
  } else if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
  } else {
    callback(new Error('Status key not found'));
  }
};

status.stop = function(callback) {
  callback = callback || function() {};

  global.localServer.close();

  callback(null, global.nodeConfig);

  setTimeout(() => {
    process.exit(0);
  }, 100);
};

status.spawn = function(configuration, callback) {
  let config = configuration;
  const existingOnStart = configuration.onStart;
  const asyncFunction = wire.toAsync(callback);
  const rpcFunction = wire.createRPC(asyncFunction);

  if (configuration.onStart) {
    let funcStr = `
          let onStartFunction = ${existingOnStart.toString()};
          let callbackRPC = ${rpcFunction.toString()};
          onStartFunction();
          callbackRPC(null, global.nodeConfig, () => {});
          `;
    config.onStart = new Function(funcStr);
  } else {
    let funcStr = `
        let callbackRPC = ${rpcFunction.toString()};
        callbackRPC(null, global.nodeConfig, () => {});
        `;
    config.onStart = new Function(funcStr);
  }

  const serializedConfig = serialization.serialize(config);
  const directory = path.join(__dirname, '../../distribution.js');
  const child = spawn('node', [directory, '--config', serializedConfig]);

  child.on('error', (err) => {
    console.error('Child process failed to start:', err);
    callback(err, null);
  });

  child.stdout.on('data', (data) => {
    console.log(`Child process stdout: ${data}`);
  });

  child;
};

module.exports = status;
