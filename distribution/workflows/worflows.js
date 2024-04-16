const crawler = require('./crawler');
const getURLs = require('./getURLs');
const invertedIndex = require('./invertedIndex');
const reverseLinks = require('./reverseLinks');
const stringMatching = require('./stringMatching');

module.exports = {
  crawler: crawler,
  getURLs: getURLs,
  invertedIndex: invertedIndex,
  reverseLinks: reverseLinks,
  stringMatching: stringMatching,
};
