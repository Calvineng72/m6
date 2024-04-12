global.nodeConfig = {ip: '127.0.0.1', port: 4000};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

const dsmGroup = {};
const iiGroup = {};

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

const n1 = {ip: '127.0.0.1', port: 4001};
const n2 = {ip: '127.0.0.1', port: 4002};
const n3 = {ip: '127.0.0.1', port: 4003};

beforeAll((done) => {
  /* Stop the nodes if they are running */

  dsmGroup[id.getSID(n1)] = n1;
  dsmGroup[id.getSID(n2)] = n2;
  dsmGroup[id.getSID(n3)] = n3;

  iiGroup[id.getSID(n1)] = n1;
  iiGroup[id.getSID(n2)] = n2;
  iiGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const dsmConfig = {gid: 'dsm'};
    startNodes(() => {
      groupsTemplate(dsmConfig).put(dsmConfig, dsmGroup, (e, v) => {
        const iiConfig = {gid: 'ii'};
        groupsTemplate(iiConfig).put(iiConfig, iiGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});

function sanityCheck(mapper, reducer, dataset, expected, done) {
  let mapped = dataset.map((o) =>
    mapper(Object.keys(o)[0], o[Object.keys(o)[0]]));
  /* Flatten the array. */
  mapped = mapped.flat();
  let shuffled = mapped.reduce((a, b) => {
    let key = Object.keys(b)[0];
    if (a[key] === undefined) a[key] = [];
    a[key].push(b[key]);
    return a;
  }, {});
  let reduced = Object.keys(shuffled).map((k) => reducer(k, shuffled[k]));

  try {
    expect(reduced).toEqual(expect.arrayContaining(expected));
  } catch (e) {
    done(e);
  }
}


// ----------------------------------------------------- //


test('(0 pts) all.mr:dsm test #1', (done) => {
  let m1 = (key, value) => {
    const regex = /\b4b6\w+/g;
    const matches = value.matchAll(regex);
    let out = [];
    for (const match of matches) {
      let o = {};
      o[key] = match[0];
      out.push(o);
    }
    return out;
  };

  let r1 = (key, values) => {
    return {[key]: values};
  };

  let dataset = [
    {'000': '4b6as4s4f 73kg02js8 29smf8whs 4b6s8gm2o'},
    {'106': '8sjgk29jf 28fjq4g02 k9aj3kf92 28jemslg9'},
    {'212': 'sj82hsk9d 2ismg02mw wigu28gj0 4b6shf91g'},
    {'318': 'asdf28v02 4b6alg92n sog92ng02 gjwog284n'},
    {'424': 'alsfo2og0 sgj0284gw 4b6sjgio9 4b6s8gm2o'},
  ];

  let expected = [{'000': ['4b6as4s4f', '4b6s8gm2o']},
    {'212': ['4b6shf91g']},
    {'318': ['4b6alg92n']},
    {'424': ['4b6sjgio9', '4b6s8gm2o']}];

  /* Sanity check: map and reduce locally */
  sanityCheck(m1, r1, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.dsm.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }


      distribution.dsm.mr.exec({keys: v, map: m1, reduce: r1}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.dsm.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(0 pts) all.mr:dsm test #2', (done) => {
  let m2 = (key, value) => {
    const regex = /\bals\w+/g;
    const matches = value.matchAll(regex);
    let out = [];
    for (const match of matches) {
      let o = {};
      o[key] = match[0];
      out.push(o);
    }
    return out;
  };

  let r2 = (key, values) => {
    return {[key]: values};
  };

  let dataset = [
    {'0000': '4b6as4s4fq alsg02js8q 29smf8whsq 4b6s8gm2oq'},
    {'2120': 'sj82hsk9dq alsmg02mwq wigu28gj0q 4b6shf91gq'},
    {'3180': 'asdf28v02q 4b6alg92nq als92ng02q alsog284nq'},
    {'5150': 'alsfo2og0q 2ismg02mwq als23g3gfq als2qe4guq'},
    {'2890': 'alssjgio9q sgj0284gwq 4b6sjgio9q 4b6s8gm2oq'},
  ];

  let expected = [{'0000': ['alsg02js8q']},
    {'2120': ['alsmg02mwq']},
    {'3180': ['als92ng02q', 'alsog284nq']},
    {'5150': ['alsfo2og0q', 'als23g3gfq', 'als2qe4guq']}];

  /* Sanity check: map and reduce locally */
  sanityCheck(m2, r2, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    const keys = dataset.map((o) => Object.keys(o)[0]);
    distribution.dsm.mr.exec({keys: keys, map: m2, reduce: r2}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.dsm.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(0 pts) all.mr:ii test #1', (done) => {
  let m3 = (_key, value) => {
    const url = 'https://www.example.com';
    let out = {};
    out[value] = [1, url];
    return out;
  };

  let r3 = (key, values) => {
    let sum = values.reduce((total, current) => total + current[0], 0);
    let out = {};
    out[key] = [sum, values[0][1]];
    return out;
  };

  let dataset = [
    {'aaa': 'check stuff level'},
    {'bbb': 'check stuff level'},
    {'ccc': 'level check stuff'},
    {'ddd': 'level right'},
    {'eee': 'right'},
  ];

  let expected = [{'check stuff level': [2, 'https://www.example.com']},
    {'level check stuff': [1, 'https://www.example.com']},
    {'level right': [1, 'https://www.example.com']},
    {'right': [1, 'https://www.example.com']}];

  /* Sanity check: map and reduce locally */
  sanityCheck(m3, r3, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    const keys = dataset.map((o) => Object.keys(o)[0]);
    distribution.ii.mr.exec({keys: keys, map: m3, reduce: r3}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.ii.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(0 pts) all.mr:ii test #2', (done) => {
  let m4 = (_key, value) => {
    const url = 'https://www.example2.com';
    let out = {};
    out[value] = [1, url];
    return out;
  };

  let r4 = (key, values) => {
    let sum = values.reduce((total, current) => total + current[0], 0);
    let out = {};
    out[key] = [sum, values[0][1]];
    return out;
  };

  let dataset = [
    {'aaaa': 'check meow level'},
    {'bbbb': 'check meow level'},
    {'cccc': 'level check meow'},
    {'dddd': 'level up'},
    {'eeee': 'up'},
    {'ffff': 'check meow level'},
    {'gggg': 'check meow level'},
    {'hhhh': 'level check meow'},
    {'iiii': 'level meow'},
    {'jjjj': 'down'},
  ];

  let expected = [{'check meow level': [4, 'https://www.example2.com']},
    {'level check meow': [2, 'https://www.example2.com']},
    {'level up': [1, 'https://www.example2.com']},
    {'level meow': [1, 'https://www.example2.com']},
    {'down': [1, 'https://www.example2.com']},
    {'up': [1, 'https://www.example2.com']}];

  /* Sanity check: map and reduce locally */
  sanityCheck(m4, r4, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    const keys = dataset.map((o) => Object.keys(o)[0]);
    distribution.ii.mr.exec({keys: keys, map: m4, reduce: r4}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.ii.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(0 pts) all.mr:crawler test #1', (done) => {
  let m5 = (key, value) => {
    return new Promise((resolve, reject) => {
      global.fetch(value)
          .then((response) => {
            return response.text();
          })
          .then((text) => {
            let out = {};
            out[value] = text;
            resolve(out);
          })
          .catch((error) => {
            reject(error);
          });
    });
  };

  let r5 = (key, values) => {
    let out = {};
    out[key] = values;
    return out;
  };

  let dataset = [
    {'url1': 'https://www.google.com'},
    {'url2': 'https://www.example.com'},
  ];

  /* Sanity check: map and reduce locally */
  // sanityCheck(m5, r5, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    const keys = dataset.map((o) => Object.keys(o)[0]);
    distribution.dsm.mr.exec({keys: keys, map: m5, reduce: r5}, (e, v) => {
      try {
        expect(v[1]['https://www.google.com'][0]).toEqual(expect.stringContaining('Google'));
        expect(v[0]['https://www.example.com'][0]).toEqual(expect.stringContaining('Domain'));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.dsm.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});
