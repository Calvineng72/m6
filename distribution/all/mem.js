const id = require('../util/id');

let mem = (config) => {
  let context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;

  return {
    get: (key, callback) => {
      callback = callback || function() {};

      if (!key) {
        const remote = {
          service: 'mem',
          method: 'get',
        };
        const message = [{gid: context.gid, key: key}];
        distribution[context.gid].comm.send(message, remote, (e, v) => {
          const keys = Object.values(v).flat();
          callback({}, keys);
        });
        return;
      }

      distribution.local.groups.get(context.gid, (err, val) => {
        if (err) {
          callback(Error('The group\'s nodes cannot be retrieved!'), null);
        } else {
          const allNodes = Object.values(val);
          const nids = allNodes.map((node) => {
            return id.getNID(node);
          });

          const nid = context.hash(id.getID(key), nids);
          const node = allNodes.find((node) => id.getNID(node) === nid);

          const remote = {
            service: 'mem',
            method: 'get',
            node: node,
          };
          const message = [{gid: context.gid, key: key}];
          distribution.local.comm.send(message, remote, (e, v) => {
            if (e) {
              callback(e, null);
            } else {
              callback(e, v);
            }
          });
        }
      });
    },
    put: (value, key, callback) => {
      callback = callback || function() {};
      key = !key ? id.getID(value) : key;

      if (!value) {
        callback(Error('The value is missing!'), null);
        return;
      }

      distribution.local.groups.get(context.gid, (err, val) => {
        if (err) {
          callback(Error('The group\'s nodes cannot be retrieved!'), null);
        } else {
          const allNodes = Object.values(val);
          const nids = allNodes.map((node) => {
            return id.getNID(node);
          });

          const nid = context.hash(id.getID(key), nids);
          const node = allNodes.find((node) => id.getNID(node) === nid);

          const remote = {
            service: 'mem',
            method: 'put',
            node: node,
          };
          const message = [value, {gid: context.gid, key: key}];
          distribution.local.comm.send(message, remote, (e, v) => {
            if (e) {
              callback(e, null);
            } else {
              callback(null, v);
            }
          });
        }
      });
    },
    del: (key, callback) => {
      callback = callback || function() {};

      if (!key) {
        callback(Error('The key is missing!'), null);
      } else {
        distribution.local.groups.get(context.gid, (err, val) => {
          if (err) {
            callback(Error('The group\'s nodes cannot be retrieved!'), null);
          } else {
            const allNodes = Object.values(val);
            const nids = allNodes.map((node) => {
              return id.getNID(node);
            });

            const nid = context.hash(id.getID(key), nids);
            const node = allNodes.find((node) => id.getNID(node) === nid);

            const remote = {
              service: 'mem',
              method: 'del',
              node: node,
            };
            const message = [{gid: context.gid, key: key}];
            distribution.local.comm.send(message, remote, (e, v) => {
              if (e) {
                callback(e, null);
              } else {
                callback(null, v);
              }
            });
          }
        });
      }
    },
    reconf: (oldGroup, callback) => {
      callback = callback || function() {};

      distribution.local.groups.get(context.gid, (err, nodes) => {
        if (err) {
          callback(Error('The group\'s nodes cannot be retrieved!'), null);
        }

        const newGroup = Object.values(nodes);
        const newNids = newGroup.map((node) => {
          return id.getNID(node);
        });

        oldGroup = Object.values(oldGroup);
        const oldNids = oldGroup.map((node) => {
          return id.getNID(node);
        });

        distribution[context.gid].mem.get(null, (err, keys) => {
          if (Object.keys(err).length !== 0) {
            callback(err, null);
          }

          keys.forEach((key) => {
            const oldNID = context.hash(id.getID(key), oldNids);
            const newNID = context.hash(id.getID(key), newNids);

            const oldNode = oldGroup.find((node) => id.getNID(node) === oldNID);
            const newNode = newGroup.find((node) => id.getNID(node) === newNID);

            if (oldNID !== newNID) {
              const remote = {
                service: 'mem',
                method: 'get',
                node: oldNode,
              };
              const message = [{gid: context.gid, key: key}];
              distribution.local.comm.send(message, remote, (e, v) => {
                if (e) {
                  return;
                } else {
                  const remote = {
                    service: 'mem',
                    method: 'del',
                    node: oldNode,
                  };
                  const message = [{gid: context.gid, key: key}];
                  distribution.local.comm.send(message, remote, (e, v) => {
                    if (e) {
                      return;
                    } else {
                      const remote = {
                        service: 'mem',
                        method: 'put',
                        node: newNode,
                      };
                      const message = [v, {gid: context.gid, key: key}];
                      distribution.local.comm.send(message, remote, (e, v) => {
                        if (e || v) {
                          return;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
          callback();
        });
      });
    },
  };
};

module.exports = mem;
