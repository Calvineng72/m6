const mr = function(config) {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    exec: (configuration, callback) => {
      // Unpack the configuration
      const keys = Object.values(configuration.keys);
      const map = configuration.map;
      const reduce = configuration.reduce;


      // Create MapReduce service for the nodes
      let service = {};

      // Map service
      service.map = (map, keys, groupName, callback) => {
        callback = callback || function() {};

        const results = [];
        distribution.local.store.get({gid: groupName}, (error, keysMap) => {
          if (error) {
            callback(error, null);
            return;
          }

          const localKeys = Object.values(keysMap);
          let localKeysLength = 0;
          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              localKeysLength++;
            }
          }

          if (localKeysLength === 0) {
            callback(null, []);
            return;
          }

          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              const key = {gid: groupName, key: localKey};
              distribution.local.store.get(key, (error, value) => {
                if (error) {
                  callback(error, null);
                  return;
                }

                const result = map(localKey, value);
                results.push(result);

                localKeysLength--;
                if (localKeysLength === 0) {
                  Promise.all(results).then((allResults) => {
                    const resultsID = distribution.util.id.getID(allResults);
                    distribution[groupName].store.put(allResults, resultsID,
                        (error, _value) => {
                          if (error) {
                            callback(error, null);
                          } else {
                            callback(null, resultsID);
                          }
                        });
                  })
                      .catch((error) => {
                        callback(error, null);
                      });
                }
              });
            }
          }
        });
      };

      // Shuffle service
      service.shuffle = (keys, groupName, callback) => {
        callback = callback || function() {};

        const reduceKeys = [];
        distribution.local.store.get({gid: groupName}, (error, keysMap) => {
          if (error) {
            callback(error, null);
            return;
          }

          const localKeys = Object.values(keysMap);
          let localKeysLength = 0;
          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              localKeysLength++;
            }
          }

          if (localKeysLength === 0) {
            callback(null, []);
            return;
          }

          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              const key = {gid: groupName, key: localKey};
              distribution.local.store.get(key, (error, value) => {
                if (error) {
                  callback(error, null);
                  return;
                }

                const mapResults = Object.values(value).flat(depth=3);
                let mapResultsLength = mapResults.length;
                for (const mapResult of mapResults) {
                  const [key, value] = Object.entries(mapResult)[0];
                  const map = {[key]: value};

                  const keyID = distribution.util.id.getID(key);
                  if (!reduceKeys.includes(keyID)) {
                    reduceKeys.push(keyID);
                  }

                  distribution[groupName].store.append(map, keyID,
                      (error, _value) => {
                        if (error) {
                          callback(error, null);
                        } else {
                          mapResultsLength--;
                          if (mapResultsLength === 0) {
                            localKeysLength--;
                            if (localKeysLength === 0) {
                              callback(null, reduceKeys);
                            }
                          }
                        }
                      });
                }
              });
            }
          }
        });
      };

      // Reduce service
      service.reduce = (reduce, keys, groupName, callback) => {
        callback = callback || function() {};

        const results = [];
        distribution.local.store.get({gid: groupName}, (error, keysMap) => {
          if (error) {
            callback(error, null);
            return;
          }

          const localKeys = Object.values(keysMap);
          let localKeysLength = 0;
          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              localKeysLength++;
            }
          }

          if (localKeysLength === 0) {
            callback(null, []);
            return;
          }

          for (const localKey of localKeys) {
            if (keys.includes(localKey)) {
              const storeKey = {gid: groupName, key: localKey};
              distribution.local.store.get(storeKey, (error, value) => {
                if (error) {
                  callback(error, null);
                  return;
                }

                const [mapKey, mapValue] = Object.entries(value)[0];
                const result = reduce(mapKey, mapValue);
                results.push(result);

                localKeysLength--;
                if (localKeysLength === 0) {
                  const resultsID = distribution.util.id.getID(results);
                  distribution[groupName].store.put(results, resultsID,
                      (error, _value) => {
                        if (error) {
                          callback(error, null);
                        } else {
                          callback(null, resultsID);
                        }
                      });
                }
              });
            }
          }
        });
      };


      // Start MapReduce process
      const serviceID = distribution.util.id.getID(service);
      const serviceName = `mr-${serviceID}`;

      // 1) Send MapReduce service to each node
      function startMapReduce() {
        distribution[context.gid].routes.put(service, serviceName,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              distributedMap();
            });
      }

      // 2) Map each data
      function distributedMap() {
        const message = [map, keys, context.gid];
        const remote = {service: serviceName, method: 'map'};
        distribution[context.gid].comm.send(message, remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const mapResults = Object.values(values).flat(depth=3);
              distributedShuffle(mapResults);
            });
      }

      // 3) Shuffle the map results
      function distributedShuffle(mapResults) {
        const message = [mapResults, context.gid];
        const remote = {service: serviceName, method: 'shuffle'};
        distribution[context.gid].comm.send(message, remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const shuffleKeys = Object.values(values).flat(depth=3);
              const shuffleResults = [...new Set(shuffleKeys)];
              distributedReduce(shuffleResults);
            });
      }

      // 4) Reduce the shuffle results
      function distributedReduce(shuffleResults) {
        const message = [reduce, shuffleResults, context.gid];
        const remote = {service: serviceName, method: 'reduce'};
        distribution[context.gid].comm.send(message, remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const reduceResults = Object.values(values).flat(depth=3);
              retrieveResults(reduceResults);
            });
      }

      // 5) Retrieve final results from storage (distributed persistence)
      function retrieveResults(reduceResults) {
        const retrievedResults = [];

        let reduceResultsLength = reduceResults.length;
        for (const reduceResult of reduceResults) {
          distribution[context.gid].store.get(reduceResult,
              (error, value) => {
                if (error) {
                  callback(error, null);
                  return;
                }

                retrievedResults.push(value);

                reduceResultsLength--;
                if (reduceResultsLength === 0) {
                  const finalResults = retrievedResults.flat(depth=3);
                  callback(null, finalResults);
                }
              });
        }
      }

      startMapReduce();
    },
  };
};

module.exports = mr;
