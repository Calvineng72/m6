global.gossipMessages = [];

const gossip = {
  recv: (payload, callback) => {
    callback = callback || function() {};

    let message = payload.message;
    let remote = payload.remote;
    let mid = payload.mid;
    let gid = payload.gid;

    if (global.gossipMessages.includes(mid)) {
      callback(new Error('Message already received!'), null);
      return;
    }

    global.gossipMessages.push(mid);
    distribution[gid].gossip.send(payload, remote);

    remote.node = {
      ip: global.nodeConfig.ip,
      port: global.nodeConfig.port,
    };
    distribution.local.comm.send(message, remote, (err, val) => {
      callback(err, val);
    });
  },
};

module.exports = gossip;
