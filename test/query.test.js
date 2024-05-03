global.nodeConfig = {ip: '127.0.0.1', port: 2000};
const distribution = require('../distribution');
const id = distribution.util.id;

const indexerGroup = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   The process that node is
   running in is the actual jest process
*/

let localServer = null;

/*
    The local node will be the orchestrator.
*/

const n1 = {ip: '127.0.0.1', port: 3001};
const n2 = {ip: '127.0.0.1', port: 3002};
const n3 = {ip: '127.0.0.1', port: 3003};

beforeAll((done) => {
  /* Stop the nodes if they are running */

  indexerGroup[id.getSID(n1)] = n1;
  indexerGroup[id.getSID(n2)] = n2;
  indexerGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (_e, _v) => {
      distribution.local.status.spawn(n2, (_e, _v) => {
        distribution.local.status.spawn(n3, (_e, _v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      const configuration = {gid: 'all', hash: id.consistentHash};
      distribution.all.groups.put({gid: 'all'}, indexerGroup, (_e, _v) => {
        done();
      });
    });
  });
});

afterAll((done) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (_e, _v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (_e, _v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (_e, _v) => {
        localServer.close();
        done();
      });
    });
  });
});


// ----------------------------------------------------- //

const query = require('../distribution/subsystems/querySubsystem');

test('(0 pts) query subsystem', (done) => {
  console.time('query');
  const url = query('serialize fetch', (result) => {
    expect(result).toBeDefined();
    console.timeLog('query');
    console.log(`The top URLs are: ${result}`);
    done();
  });
});
