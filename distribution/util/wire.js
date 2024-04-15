const id = require('../util/id');

global.toLocal = new Map();

function createRPC(func) {
  const functionID = id.getID(func);
  global.toLocal.set(functionID, func);

  let functionStr = `
    const callback = args.pop() || function() {};

    let message = args;
    let remote = {
      node: ${JSON.stringify(global.nodeConfig)},
      service: '${functionID}',
      method: 'call',
    };

    distribution.local.comm.send(message, remote, (error, response) => {
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
  `;

  return new Function('...args', functionStr);
}

/*
    The toAsync function converts a synchronous function that returns a value
    to one that takes a callback as its last argument and returns the value
    to the callback.
*/
function toAsync(func) {
  return function(...args) {
    const callback = args.pop() || function() {};
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
