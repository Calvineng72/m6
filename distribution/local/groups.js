const id = require('../util/id');

global.groups = new Map();

const groups = {
  get: (configuration, callback) => {
    callback = callback || function() {};

    let groupName;
    if (configuration.gid) {
      groupName = configuration.gid;
    } else {
      groupName = configuration;
    }

    const groupInfo = global.groups.get(groupName);
    if (groupInfo) {
      callback(null, groupInfo);
    } else {
      callback(new Error('This group does not exist.'), null);
    }
  },
  del: (configuration, callback) => {
    callback = callback || function() {};

    let groupName;
    if (configuration.gid) {
      groupName = configuration.gid;
    } else {
      groupName = configuration;
    }

    if (global.groups.has(groupName)) {
      nodesToDelete = global.groups.get(groupName);
      global.groups.delete(groupName);
      callback(null, nodesToDelete);
    } else {
      callback(new Error('This group does not exist.'), null);
    }
  },
  put: (configuration, nodes, callback) => {
    callback = callback || function() {};

    let config;
    let groupName;
    if (configuration.gid) {
      groupName = configuration.gid;
      config = configuration;
    } else {
      groupName = configuration;
      config = {gid: configuration};
    }

    if (!groupName) {
      callback(new Error('No group name was provided.'), null);
    } else if (!nodes) {
      callback(new Error('No nodes were provided.'), null);
    } else {
      global.groups.set(groupName, nodes);

      distribution[groupName] = {};
      const comm = require('../all/comm');
      distribution[groupName].comm = comm(config);
      const gossip = require('../all/gossip');
      distribution[groupName].gossip = gossip(config);
      const groups = require('../all/groups');
      distribution[groupName].groups = groups(config);
      const routes = require('../all/routes');
      distribution[groupName].routes = routes(config);
      const status = require('../all/status');
      distribution[groupName].status = status(config);
      const store = require('../all/store');
      distribution[groupName].store = store(config);
      const mem = require('../all/mem');
      distribution[groupName].mem = mem(config);
      const mr = require('../all/mr');
      distribution[groupName].mr = mr(config);

      callback(null, nodes);
    }
  },
  add: (configuration, node, callback) => {
    callback = callback || function() {};

    let groupName;
    if (configuration.gid) {
      groupName = configuration.gid;
    } else {
      groupName = configuration;
    }

    if (!groupName) {
      callback(new Error('No group name was provided.'), null);
    } else if (!node) {
      callback(new Error('No node was provided.'), null);
    } else {
      const nodeSID = id.getSID(node);
      const newNode = {[nodeSID]: {ip: node.ip, port: node.port}};

      if (global.groups.has(groupName)) {
        const existingNodes = global.groups.get(groupName);
        existingNodes[nodeSID] = newNode[nodeSID];
        global.groups.set(groupName, existingNodes);
        callback(null, existingNodes);
      } else {
        global.groups.set(groupName, newNode);
        callback(null, newNode);
      }
    }
  },
  rem: (configuration, nodeName, callback) => {
    callback = callback || function() {};

    let groupName;
    if (configuration.gid) {
      groupName = configuration.gid;
    } else {
      groupName = configuration;
    }

    if (!groupName) {
      callback(new Error('No group name was provided.'), null);
    } else if (!nodeName) {
      callback(new Error('No node name was provided.'), null);
    } else {
      if (global.groups.has(groupName)) {
        const existingNodes = global.groups.get(groupName);
        delete existingNodes[nodeName];
        global.groups.set(groupName, existingNodes);
        callback(null, existingNodes);
      }
    }
  },
};

module.exports = groups;

