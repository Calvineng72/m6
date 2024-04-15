const id = require('../util/id');

let groups = (config) => {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;

  return {
    get: (configuration, callback) => {
      callback = callback || function() {};

      const remote = {
        service: 'groups',
        method: 'get',
      };
      const message = [configuration];
      distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },
    del: (configuration, callback) => {
      callback = callback || function() {};

      distribution.local.groups.del(configuration, () => {
        const remote = {
          service: 'groups',
          method: 'del',
        };
        const message = [configuration];
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          callback(e, v);
        });
      });
    },
    put: (configuration, nodes, callback) => {
      callback = callback || function() {};

      distribution.local.groups.put(configuration, nodes, (e, v) => {
        if (e) {
          callback(e, null);
        }
        const remote = {
          service: 'groups',
          method: 'put',
        };
        const message = [configuration, nodes];
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          callback(e, v);
        });
      });
    },
    add: (configuration, nodes, callback) => {
      callback = callback || function() {};

      distribution.local.groups.add(configuration, nodes, (e, v) => {
        const remote = {
          service: 'groups',
          method: 'add',
        };
        const message = [configuration, nodes];
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          callback(e, v);
        });
      });
    },
    rem: (configuration, nodes, callback) => {
      callback = callback || function() {};

      distribution.local.groups.rem(configuration, nodes, (e, v) => {
        const remote = {
          service: 'groups',
          method: 'rem',
        };
        const message = [configuration, nodes];
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          callback(e, v);
        });
      });
    },
  };
};

module.exports = groups;
