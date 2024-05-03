global.nodeConfig = {ip: '127.0.0.1', port: 1000};
const distribution = require('../distribution');
const id = distribution.util.id;

const group = {};

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
    group[id.getSID(node)] = node;
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
      distribution.all.groups.put(configuration, group, (_e, _v) => {
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

const crawler = require('../distribution/subsystems/crawlingSubsystem');
const crawlerMap = crawler.map;
const crawlerReduce = crawler.reduce;

test('(0 pts) crawler subsystem', (done) => {
  console.time('crawl');

  let m = crawlerMap;
  let r = crawlerReduce;

  let dataset = [
    {'https://www.npmjs.com/search?q=text':
        'https://www.npmjs.com/search?q=text'},
  ];

  /* Now we do the same thing but on the cluster */
  let keys = dataset.map((o) => id.getID(Object.keys(o)[0]));
  const doMapReduce = (_cb) => {
    distribution.all.mr.exec(
        {keys: keys, map: m, reduce: r, rounds: 1},
        (_e, v) => {
          console.timeLog('crawl');
          try {
            expect(v).toBeDefined();
            done();
          } catch (e) {
            done(e);
          }
        });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = id.getID(Object.keys(o)[0]);
    let value = o;
    distribution.all.store.put(value, key, (_e, _v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
}, 10000000);
