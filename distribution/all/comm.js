let comm = (config) => {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    send: (message, remote, callback) => {
      distribution.local.groups.get(context.gid, (err, nodes) => {
        callback = callback || function() {};

        if (err) {
          callback(err, null);
        }

        const values = {};
        const errors = {};
        let responseCount = 0;

        const nodeCount = Object.keys(nodes).length;
        const handleResponse = (nodeID, e, v) => {
          if (e) {
            errors[nodeID] = e;
          } else {
            values[nodeID] = v;
          }
          responseCount++;

          if (responseCount === nodeCount) {
            if (remote.method === 'spawn') {
              callback(null, values);
            } else if (message[0] === 'heapTotal' ||
                      message[0] === 'heapUsed') {
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


        for (const nodeID in nodes) {
          if (nodes.hasOwnProperty(nodeID)) {
            const node = nodes[nodeID];
            remote.node = {ip: node.ip, port: node.port};
            distribution.local.comm.send(message, remote, (e, v) => {
              handleResponse(nodeID, e, v);
            });
          }
        }
      });
    },
  };
};

module.exports = comm;
