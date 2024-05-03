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
      console.error(err);
      callback(new Error('There was an error reading the directory! ' + storeDir), null);
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
    console.error(err);
    callback(new Error('The key could not be found! ' + fullKey), null);
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
    console.error(err);
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
      console.error(err);
      callback(new Error('There was an error deleting the file!'), null);
    }
  });
};

store.append = (value, key, callback) => {
  callback = callback || function() {};
  const [mapKey, mapValue] = Object.entries(value)[0];

  distribution.local.store.get(key, (err, data) => {
    if (!err) {
      try {
        data[mapKey].push(mapValue);
      } catch (err) {
        data = {[mapKey]: [mapValue]};
      }
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

store.multiAppend = (values, key, callback) => {
  callback = callback || function() {};
  let mapKeys = [];
  let mapValues = [];

  for (let i = 0; i < values.length; i++) {
    let k = Object.keys(values[i])[0];
    let v = Object.values(values[i])[0];
    mapKeys.push(k);
    mapValues.push(v);
  }

  distribution.local.store.get((key), (err, data) => {
    // console.log("Mapkeys: ", mapKeys);
    // console.log("Mapvalues: ", mapValues);
    if (!err) {
      mapKeys.forEach((k, i) => {
        try {
          data[k].push(mapValues[i]);
        } catch (err) {
          data[k] = [mapValues[i]];
        }
      });
    } else {
      data = {};
      mapKeys.forEach((k, i) => {
        try {
          data[k].push(mapValues[i]);
        } catch (err) {
          data[k] = [mapValues[i]];
        }
      });
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

store.batchOperation = (op, params, callback) => {
  console.log('BEGIN LOCAL BATCH OPERATION on NODE ', id.getNID(global.nodeConfig));
  // params should be an array of params to apply directly
  callback = callback || function() {};

  let cntr = params.length;
  let values = [];

  if (params.length === 0) {
    callback(null, []);
    return;
  }

  params.forEach((param) => {
    if (!Array.isArray(param)) {
      param = [param];
    }

    distribution.local.store[op](...param, (err, value) => {
      if (err) {
        callback(err, null);
        return;
      } else {
        cntr--;
        values.push(value);
        if (cntr === 0) {
          console.log('FINISH LOCAL BATCH OPERATION on NODE ', id.getNID(global.nodeConfig));
          callback(null, values);
        }
      }
    });
  });
};

module.exports = store;
