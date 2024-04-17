const id = require('../util/id');
const serialize = require('../util/serialization').serialize;
const deserialize = require('../util/serialization').deserialize;
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..', 'store');
const storeDir = path.join(baseDir, id.getSID(global.nodeConfig));
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, {recursive: true});
}

const store = {};

store.get = (key, callback) => {
  callback = callback || function() {};

  let gid = null;
  let actualKey = key;
  if (typeof key === 'object' && key !== null) {
    gid = key.gid;
    actualKey = key.key;
  }

  if (!actualKey) {
    try {
      const keys = fs.readdirSync(storeDir);
      if (gid) {
        const filteredKeys = keys.filter((k) => k.startsWith(gid))
            .map((k) => k.split(':')[1]);
        callback(null, filteredKeys);
      } else {
        callback(null, keys);
      }
    } catch (err) {
      callback(new Error('There was an error reading the directory!'), null);
    }
    return;
  }

  actualKey = actualKey.replace(/[^a-zA-Z0-9]/g, '');
  let fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  const filePath = path.join(storeDir, fullKey);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    callback(null, deserialize(data));
  } catch (err) {
    callback(new Error('The key could not be found!'), null);
  }
};

store.put = (value, key, callback) => {
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

  actualKey = actualKey.replace(/[^a-zA-Z0-9]/g, '');
  let fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  const filePath = path.join(storeDir, fullKey);
  try {
    fs.writeFileSync(filePath, serialize(value), 'utf8');
    callback(null, value);
  } catch (err) {
    callback(new Error('The value could not be stored'), null);
  }
};

store.del = (key, callback) => {
  callback = callback || function() {};

  let gid = null;
  let actualKey = key;
  if (typeof key === 'object' && key !== null) {
    gid = key.gid;
    actualKey = key.key;
  }

  actualKey = actualKey.replace(/[^a-zA-Z0-9]/g, '');
  let fullKey = gid ? `${gid}:${actualKey}` : actualKey;
  const filePath = path.join(storeDir, fullKey);

  distribution.local.store.get(key, (err, value) => {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      fs.unlinkSync(filePath);
      callback(null, value);
    } catch (err) {
      callback(new Error('There was an error deleting the file!'), null);
    }
  });
};

store.append = (value, key, callback) => {
  callback = callback || function() {};
  const [mapKey, mapValue] = Object.entries(value)[0];

  distribution.local.store.get(key, (err, data) => {
    if (!err) {
      data[mapKey].push(mapValue);
    } else {
      data = {[mapKey]: [mapValue]};
    }

    distribution.local.store.put(data, key, (err, value) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, value);
    });
  });
};

module.exports = store;
