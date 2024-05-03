global.nodeConfig = {ip: '127.0.0.1', port: 1000};
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

const numberNodes = 5;
const nodes = [];
for (let i = 1; i <= numberNodes; i++) {
  nodes.push({ip: '127.0.0.1', port: 1000 + i});
}

beforeAll((done) => {
  /* Stop the nodes if they are running */

  nodes.forEach((node) => {
    indexerGroup[id.getSID(node)] = node;
  });

  const startNodes = (cb) => {
    let counter = 0;
    nodes.forEach((node) => {
      distribution.local.status.spawn(node, (_e, _v) => {
        counter++;
        if (counter === nodes.length) {
          cb();
        }
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      const configuration = {gid: 'all', hash: id.consistentHash};
      distribution.all.groups.put(configuration, indexerGroup, (_e, _v) => {
        done();
      });
    });
  });
});

afterAll((done) => {
  let counter = 0;

  const stopNode = (node, callback) => {
    let remote = {service: 'status', method: 'stop', node};
    distribution.local.comm.send([], remote, (_e, _v) => {
      counter++;
      if (counter === nodes.length) {
        localServer.close();
        done();
      }
    });
  };

  nodes.forEach((node) => {
    stopNode(node);
  });
});


// ----------------------------------------------------- //

const query = require('../distribution/subsystems/querySubsystem');

test('(0 pts) query subsystem', (done) => {
  console.time('query');
  query('serialize', (result) => {
    expect(result).toBeDefined();
    console.timeLog('query');
    console.log(`The top URLs are: ${result}`);
    done();
  });
});
