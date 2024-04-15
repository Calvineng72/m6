const id = require('../util/id');

global.periodicChecks = new Set();

let gossip = (config) => {
  let context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || 3;

  return {
    send: (payload, remote, callback) => {
      callback = callback || function() {};

      distribution.local.groups.get(context.gid, (err, nodes) => {
        if (err) {
          callback(err, null);
        }

        const randomNodes = [];
        let nodeNames = Object.keys(nodes);
        let numberNodes = Math.min(context.subset, Object.keys(nodes).length);
        for (let i = 0; i < numberNodes; i++) {
          const randomIndex = Math.floor(Math.random() * nodeNames.length);
          randomNodes.push(nodeNames[randomIndex]);
          nodeNames.splice(randomIndex, 1);
        }

        const values = {};
        const errors = {};
        let responseCount = 0;

        let newPayload = {};
        if (!payload.mid || !payload.gid) {
          newPayload.mid = id.getID(payload);
          newPayload.gid = context.gid;
          newPayload.message = payload;
          newPayload.remote = remote;
        } else {
          newPayload = payload;
        }

        const handleResponse = (nodeID, e, v) => {
          if (e) {
            errors[nodeID] = e;
          } else {
            values[nodeID] = v;
          }
          responseCount++;

          if (responseCount === numberNodes) {
            if (newPayload.remote.method === 'spawn') {
              callback(null, values);
            } else if (newPayload.message[0] === 'heapTotal' ||
                  newPayload.message[0] === 'heapUsed') {
              let total = 0;
              for (const nodeID in values) {
                if (values.hasOwnProperty(nodeID)) {
                  total += values[nodeID];
                }
              }
              callback(errors, total);
            } else {
              callback(errors, values);
            }
          }
        };

        for (const nodeID of randomNodes) {
          if (nodes.hasOwnProperty(nodeID)) {
            const node = nodes[nodeID];
            let newRemote = {
              node: {ip: node.ip, port: node.port},
              service: 'gossip',
              method: 'recv',
            };

            distribution.local.comm.send([newPayload], newRemote, (e, v) => {
              handleResponse(nodeID, e, v);
            });
          }
        }
      });
    },
    at: (interval, toExecute, callback) => {
      callback = callback || function() {};
      let periodicCheck = setInterval(() => {
        toExecute();
      }, interval);
      global.periodicChecks.add(periodicCheck);
      callback(null, periodicCheck);
    },
    del: (toStop, callback) => {
      if (global.periodicChecks.has(toStop)) {
        clearInterval(toStop);
        global.periodicChecks.delete(toStop);
        callback();
      }
    },
  };
};

module.exports = gossip;
