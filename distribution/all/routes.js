let routes = (config) => {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    put: (route, name, callback) => {
      callback = callback || function() {};

      const remote = {
        service: 'routes',
        method: 'put',
      };
      const message = [route, name];
      distribution[context.gid].comm.send(message, remote, (e, v) => {
        callback(e, v);
      });
    },
  };
};

module.exports = routes;
