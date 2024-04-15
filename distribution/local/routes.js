global.routesMap = new Map();

const routes = {
  get: (property, callback) => {
    object = global.routesMap.get(property);
    if (object) {
      callback(null, object);
      return;
    }
    switch (property) {
      case 'status':
        callback(null, distribution.local.status);
        break;
      case 'routes':
        callback(null, distribution.local.routes);
        break;
      case 'comm':
        callback(null, distribution.local.comm);
        break;
      case 'groups':
        callback(null, distribution.local.groups);
        break;
      case 'gossip':
        callback(null, distribution.local.gossip);
        break;
      case 'mem':
        callback(null, distribution.local.mem);
        break;
      case 'store':
        callback(null, distribution.local.store);
        break;
      default:
        if (global.routesMap.has(property)) {
          callback(null, global.routesMap.get(property));
        } else if (global.toLocal.has(property)) {
          callback(null, global.toLocal.get(property));
        } else {
          callback(new Error('Invalid Property!'), null);
        }
    }
  },
  put: (route, name, callback) => {
    if (!route) {
      callback(new Error('No function was provided.'), null);
    } else if (!name) {
      callback(new Error('No function name was provided.'), null);
    } else if (!callback) {
      callback(new Error('No callback function was provided.'), null);
    } else {
      global.routesMap.set(name, route);
      callback();
    }
  },
};

module.exports = routes;
