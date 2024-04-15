const id = require('../util/id');

global.memory = new Map();
global.gidToKey = new Map();

const mem = {};

mem.get = (key, callback) => {
  callback = callback || function() {};

  let gid = null;
  let actualKey = key;
  if (typeof key === 'object' && key !== null) {
    gid = key.gid;
    actualKey = key.key;
  }

  if (!actualKey) {
    gid ? callback(null, Array.from(global.gidToKey.get(gid) || [])) :
        callback(null, Array.from(global.memory.keys()));
    return;
  }

  const fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  global.memory.has(fullKey) ?
    callback(null, global.memory.get(fullKey)) :
    callback(Error('The key could not be found!'), null);
};

mem.put = (value, key, callback) => {
  callback = callback || function() {};

  let gid = null;
  let actualKey = key;
  if (typeof key === 'object' && key !== null) {
    gid = key.gid;
    actualKey = key.key;
  }

  if (!actualKey) {
    actualKey = id.getID(value);
  }

  if (!value) {
    callback(Error('The value is missing!'), null);
    return;
  }

  const fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  global.memory.set(fullKey, value);

  if (gid) {
    if (!global.gidToKey.has(gid)) {
      global.gidToKey.set(gid, new Set());
    }
    global.gidToKey.get(gid).add(actualKey);
  }

  callback(null, value);
};

mem.del = (key, callback) => {
  callback = callback || function() {};

  let gid = null;
  let actualKey = key;
  if (typeof key === 'object' && key !== null) {
    gid = key.gid;
    actualKey = key.key;
  }

  const fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  distribution.local.mem.get(key, (err, value) => {
    if (err) {
      callback(err, null);
      return;
    }
    global.memory.delete(fullKey);
    if (gid && global.gidToKey.has(gid)) {
      global.gidToKey.get(gid).delete(actualKey);
      if (global.gidToKey.get(gid).size === 0) {
        global.gidToKey.delete(gid);
      }
    }
    callback(null, value);
  });
};

module.exports = mem;
