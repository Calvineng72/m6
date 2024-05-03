const mr = function(config) {
  let context = {};
  context.gid = config.gid || 'all';

  function mapToObjectArray(map) {
    // Converts JS map into an array of Objects like
    // [{originalURL1: [nextURL1]}, {originalURL2: [nextURL2, nextURL3], ...}]
    const objectArray = [];
    for (const [key, value] of map.entries()) {
      const tempObject = {};
      tempObject[key] = value;
      objectArray.push(tempObject);
    }
    return objectArray;
  }

  return {
    exec: (configuration, callback) => {
      // Unpack the configuration
      const keys = Object.values(configuration.keys);
      const map = configuration.map;
      const reduce = configuration.reduce;
      const rounds = configuration.rounds || 0;

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

                const [dataKey, dataValue] = Object.entries(value)[0];
                const result = map(dataKey, dataValue);
                if (result !== null && result !== undefined) {
                  results.push(result);
                }

                localKeysLength--;
                if (localKeysLength === 0) {
                  Promise.all(results)
                      .then((allResults) => {
                        const resultsID =
                        distribution.util.id.getID(allResults);
                        distribution[groupName].store.put(
                            allResults,
                            resultsID,
                            (error, _value) => {
                              if (error) {
                                callback(error, null);
                              } else {
                                callback(null, resultsID);
                              }
                            },
                        );
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

                const mapResults = Object.values(value).flat((depth = 3));
                console.log('[LOG] mapResults Length at shuffle phase:'
                    , mapResults.length);
                              
                let appendObjects = {};

                for (const mapResult of mapResults) {
                  const [key, value] = Object.entries(mapResult)[0];
                  const map = {[key]: value};

                  const keyID = distribution.util.id.getID(key);
                  if (!reduceKeys.includes(keyID)) {
                    reduceKeys.push(keyID);
                  }

                  if (appendObjects[keyID] === undefined) {
                    appendObjects[keyID] = [];
                  }
                  appendObjects[keyID].push(map);
                };

                let appendResultsLength = Object.keys(appendObjects).length;
                console.log('[LOG] appendResultsLength at shuffle phase: ',
                    appendResultsLength);

                let batchKeys = [];
                let batchParams = [];
                for (const [key, values] of Object.entries(appendObjects)) {
                  batchKeys.push(key);
                  batchParams.push([values, {gid: groupName, key: key}]);
                }

                console.log('[LOG] sending batchOperation at shuffle phase: ',
                    appendResultsLength);
                distribution[groupName].store.batchOperation('multiAppend',
                    batchKeys, batchParams, (errors, values) => {
                      if (errors) {
                        callback(errors, null);
                      } else {
                        callback(null, reduceKeys);
                      }
                    });
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
                if (result !== null && result !== undefined) {
                  results.push(result);
                }

                localKeysLength--;
                if (localKeysLength === 0) {
                  const resultsID = distribution.util.id.getID(results);
                  distribution[groupName].store.put(
                      results,
                      resultsID,
                      (error, _value) => {
                        if (error) {
                          callback(error, null);
                        } else {
                          callback(null, resultsID);
                        }
                      },
                  );
                }
              });
            }
          }
        });
      };

      // Start MapReduce process
      const serviceID = distribution.util.id.getID(service);
      const serviceName = `mr-${serviceID}`;
      // Initializations for iterative map reduce
      // setting to 0 is non - iterative map reduce
      const maxMapReduceIterations = rounds;
      let currentIteration = 0;
      // Accumulator of all the keys seen through iterative map reduce
      let allMapReduceData = new Map();

      // Store the keys to be processed in upcoming iteration with
      // structure of[key, key, ...]
      let keysToProcessNext = keys;

      // 1) Send MapReduce service to each node
      function startMapReduce() {
        distribution[context.gid].routes.put(
            service,
            serviceName,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              distributedMap();
            },
        );
      }

      // 2) Map each data
      function distributedMap() {
        const message = [map, keysToProcessNext, context.gid];
        const remote = {service: serviceName, method: 'map'};
        console.log('[LOG] message at map phase:', message);
        distribution[context.gid].comm.send(
            message,
            remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const mapResults = Object.values(values).flat((depth = 3));
              console.log('[LOG] results after map phase', mapResults);
              distributedShuffle(mapResults);
            },
        );
      }

      // 3) Shuffle the map results
      function distributedShuffle(mapResults) {
        const message = [mapResults, context.gid];
        const remote = {service: serviceName, method: 'shuffle'};
        distribution[context.gid].comm.send(
            message,
            remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const shuffleKeys = Object.values(values).flat((depth = 3));
              const shuffleResults = [...new Set(shuffleKeys)];
              console.log('[LOG] results after shuffle phase', shuffleResults);
              distributedReduce(shuffleResults);
            },
        );
      }

      // 4) Reduce the shuffle results
      function distributedReduce(shuffleResults) {
        const message = [reduce, shuffleResults, context.gid];
        const remote = {service: serviceName, method: 'reduce'};
        distribution[context.gid].comm.send(
            message,
            remote,
            (errors, values) => {
              if (Object.keys(errors).length !== 0) {
                callback(errors, values);
                return;
              }

              const reduceResults = Object.values(values).flat((depth = 3));
              console.log('[LOG] results after reduce phase:', reduceResults);
              retrieveResults(reduceResults);
            },
        );
      }

      // 5) Retrieve final results from storage (distributed persistence)
      function retrieveResults(reduceResults) {
        const retrievedResults = [];

        let reduceResultsLength = reduceResults.length;
        for (const reduceResult of reduceResults) {
          distribution[context.gid].store.get(reduceResult, (error, value) => {
            if (error) {
              callback(error, null);
              return;
            }

            retrievedResults.push(value);

            reduceResultsLength--;
            if (reduceResultsLength === 0) {
              // mapReduceResults has the structure
              //  [{nextURL1: originalURL},
              // {nextURL2: originalURL}, ...]
              const mapReduceResults = retrievedResults.flat(depth = 3);
              const mapReduceResultsKeys = [];

              let mapReduceLength = mapReduceResults.length;
              // Store into all-time accumulator
              // each result is {nextURL1: originalURL}
              for (const result of mapReduceResults) {
                const resultURL = Object.keys(result)[0];
                const key = distribution.util.id.getID(resultURL);

                mapReduceResultsKeys.push(key);

                // if already have key in map, then append originalURL
                // (because this URL could come from multiple places)
                if (allMapReduceData.has(resultURL)) {
                  allMapReduceData.get(resultURL).push(result[resultURL]);
                } else {
                  // set key, and then array that just has [originalURL]
                  allMapReduceData.set(resultURL, [result[resultURL]]);
                }

                // put {newURL1: originalURL} object into store under newURL1 key
                // (which is a URL that will get cleaned up anyways through the store)
                distribution[context.gid].store.put(result, key, (e, _v) => {
                  if (e) {
                    callback(e, null);
                    return;
                  }

                  mapReduceLength--;
                  if (mapReduceLength === 0) {
                    // set keysToProcessNext to the keys of the next
                    // iteration of iterative MapReduce.
                    keysToProcessNext = mapReduceResultsKeys;

                    if (currentIteration < maxMapReduceIterations) {
                      currentIteration ++;
                      distributedMap();
                    } else {
                      const outputObjectArray = mapToObjectArray(allMapReduceData);
                      callback(null, outputObjectArray);
                    }
                  }
                });
              }
            }
          });
        }
      }

      startMapReduce();
    },
  };
};

module.exports = mr;
