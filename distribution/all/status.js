let status = (config) => {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    get: (property, callback) => {
      callback = callback || function() {};

      const remote = {
        service: 'status',
        method: 'get',
      };
      const message = [property];
      distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },
    stop: (callback) => {
      callback = callback || function() {};

      const remote = {
        service: 'status',
        method: 'stop',
      };
      const message = [];
      distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },
    spawn: (configuration, callback) => {
      callback = callback || function() {};

      distribution.local.status.spawn(configuration, () => {
        distribution[context.gid].groups.add(context.gid, configuration, () => {
          callback(null, configuration);
        });
      });
    },
  };
};

module.exports = status;
