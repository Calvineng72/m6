const assert = require('assert');
var crypto = require('crypto');
var serialization = require('../util/serialization');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(serialization.serialize(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}

function idToNum(id) {
  let n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const kNum = distribution.util.id.idToNum(kid);
  const nodes = nids.map((nid) => 
    ({nid: nid, num: distribution.util.id.idToNum(nid)}));

  nodes.sort((a, b) => a.num - b.num);
  for (let i = 0; i < nodes.length; i++) {
    if (kNum <= nodes[i].num) {
      return nodes[i].nid;
    }
  }

  return nodes[0].nid;
}

function rendezvousHash(kid, nids) {
  nNums = nids.map((nid) => idToNum(getID(kid + nid)));
  maxIndex = nNums.indexOf(Math.max(...nNums));
  return nids[maxIndex];
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};
