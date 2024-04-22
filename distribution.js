#!/usr/bin/env node

const util = require('./distribution/util/util.js');
const args = require('yargs').argv;

// Default configuration
global.nodeConfig = global.nodeConfig || {
  ip: '127.0.0.1',
  port: 8080,
  onStart: () => {
    console.log('Node started!');
  },
};

// Packages for crawler
global.fetch = require('sync-fetch');
global.JSDOM = require('jsdom').JSDOM;
global.URL = require('url').URL;
global.convert = require('html-to-text').convert;

// Environment change for crawler
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// Set for visited URLs
global.visited = new Set();

// Pacakges for indexer
global.natural = require('natural');
global.stopwords = require('stopwords').english;

/*
    As a debugging tool, you can pass ip and port arguments directly.
    This is just to allow for you to easily startup nodes from the terminal.

    Usage:
    ./distribution.js --ip '127.0.0.1' --port 1234
  */
if (args.ip) {
  global.nodeConfig.ip = args.ip;
}

if (args.port) {
  global.nodeConfig.port = parseInt(args.port);
}

if (args.config) {
  let nodeConfig = util.deserialize(args.config);
  global.nodeConfig.ip = nodeConfig.ip ? nodeConfig.ip : global.nodeConfig.ip;
  global.nodeConfig.port = nodeConfig.port ?
        nodeConfig.port : global.nodeConfig.port;
  global.nodeConfig.onStart = nodeConfig.onStart ?
        nodeConfig.onStart : global.nodeConfig.onStart;
}

const distribution = {
  util: require('./distribution/util/util.js'),
  local: require('./distribution/local/local.js'),
  node: require('./distribution/local/node.js'),
};
global.distribution = distribution;

const allConfiguration = {gid: 'all', hash: util.id.consistentHash};

distribution['all'] = {};
distribution['all'].status =
    require('./distribution/all/status')(allConfiguration);
distribution['all'].comm =
    require('./distribution/all/comm')(allConfiguration);
distribution['all'].gossip =
    require('./distribution/all/gossip')(allConfiguration);
distribution['all'].groups =
    require('./distribution/all/groups')(allConfiguration);
distribution['all'].routes =
    require('./distribution/all/routes')(allConfiguration);
distribution['all'].mem =
    require('./distribution/all/mem')(allConfiguration);
distribution['all'].store =
    require('./distribution/all/store')(allConfiguration);
distribution['all'].mr =
    require('./distribution/all/mr')(allConfiguration);

module.exports = global.distribution;

/* The following code is run when distribution.js is run directly */
if (require.main === module) {
  distribution.node.start(global.nodeConfig.onStart);
}
