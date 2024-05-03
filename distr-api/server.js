const distribution = require('../distribution');
const express = require('express');
const utils = require('./utils');

// indexer setup
const indexer = require('../distribution/subsystems/indexingSubsystem');
const indexerMap = indexer.map;
const indexerReduce = indexer.reduce;
const crawler = require('../distribution/subsystems/crawlingSubsystem');
const crawlerMap = crawler.map;
const crawlerReduce = crawler.reduce;
const query = require('../distribution/subsystems/querySubsystem');

// setup express
const app = express();
app.use(express.json());

app.post('/store/put', (req, res) => {
  const {value, key} = req.body;
  distribution.all.store.put(value, key, (err, value) => {
    console.log(err);
    if (err) {
      return res.status(500).send({'error': err});
    }
    res.send({'response': value});
  });
});

app.post('/store/get', (req, res) => {
  const {key} = req.body;
  distribution.all.store.get(key, (err, value) => {
    console.log(err);
    console.log(value);
    if (err) {
      if (!typeof err === 'object' || !Object.keys(err).length === 0) {
        return res.status(500).send({'error': err});
      }
    }
    res.send({'response': value});
  });
});

app.get('/mr/query', (req, res) => {
  query(req.body, (result) => {
    res.send({'response': result});
  });
});

app.get('/mr/crawl', (req, res) => {
  let dataset = req.body;

  let keys = dataset.map((o) => utils.id.getID(Object.keys(o)[0]));
  const doMapReduce = (_cb) => {
    distribution.all.mr.exec({keys: keys, map: crawlerMap,
      reduce: crawlerReduce}, (_e, v) => {
      if (_e) {
        return res.status(500).send({'error': _e});
      }
      res.send({'response': v});
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = utils.id.getID(Object.keys(o)[0]);
    let value = o;
    distribution.all.store.put(value, key, (_e, _v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

app.get('/mr/index', (req, res) => {
  // fuck fuck fuck fuck
  // get all keys

  distribution.all.store.get(null, (err, values) => {
    if (err.length > 0) {
      console.log(err);
      return res.status(500).send({'error': err});
    }

    let textKeys = values.filter((val) => val.endsWith('text'));

    distribution.all.mr.exec({keys: textKeys, map: indexerMap,
      reduce: indexerReduce}, (err, values) => {
      if (err.length > 0) {
        console.log(err);
        return res.status(500).send({'error': err});
      }

      res.send({'response': values});
    });
  });
});

// setup local node
global.nodeConfig = {ip: '127.0.0.1', port: 3000};

// setup other nodes
const nodes = [];
for (let i = 1; i < 4; i++) {
  nodes.push({ip: '127.0.0.1', port: 3000 + i});
}

let nodeStopper = (node, callback) => {
  let remote = {service: 'status', method: 'stop', node: node};
  distribution.local.comm.send([], remote, callback);
};

let nodeStarter = (node, callback) => {
  distribution.local.status.spawn(node, (e, v) => {
    console.log(`Node ${node.ip}:${node.port} started`);
    callback();
  });
};

let groupAdder = (continuation) => {
  distribution.all.groups.put('all', nodes, continuation);
};

let serverStartup = () => {
  // listen
  const port = 3300;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

distribution.node.start((server) => {
  utils.looper(nodes, nodeStopper, 0, () => {
    utils.looper(nodes, nodeStarter, 0, () => {
      groupAdder(serverStartup);
    });
  });
});

