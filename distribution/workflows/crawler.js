let crawler = {};

// can either make the url the key or value
crawler.map = (_key, value) => {
  return new Promise((resolve, reject) => {
    global.fetch(key)
        .then((response) => {
          return response.text();
        })
        .then((text) => {
          // check if value/url is in the local.store; if it is not, then return
          // empty object or something (does mr account for returning empty object/not doing anything with it?)
          global.distribution.local.store.get(key+'-crawler', (e, v) => {
            if (e) {
              // if e, this means it doesn't exist yet so we can download it
              let out = {};
              const originalURL = key;
              const dom = new JSDOM(text);
              const document = dom.window.document;
              let s = new Set();

              let o = [];
              for (const link of document.links) {
                if (!s.has(link.href)) {
                  let fullURL = originalURL;
                  if (link.href.charAt(0) == '/') {
                    if (originalURL.charAt(originalURL.length - 1) == '/') {
                      fullURL = new URL(
                          link.href,
                          originalURL.substring(0, originalURL.length - 1),
                      );
                    } else {
                      fullURL = new URL(link.href, originalURL);
                    }
                  } else {
                    fullURL = new URL(link.href);
                  }
                  s.add(link.href);
                  o.push(fullURL.toString());
                }
              }

              const urltotextObj = {};
              urltotextObj[key] = text;

              global.distribution.local.store.put(urltotextObj, key+'-crawled', (e, v) => {
                if (e) {
                  console.log('Error putting url, text pair into local store: ', e);
                  return;
                }
                out[originalURL] = o;
                return out;
              });
            } else {
              // it exists so we return nothing
              return null; // or return empty object? not sure how mr works
            }
          });
        })
        .catch((error) => {
          reject(error);
        });
  });
};

crawler.reduce = (key, values) => {
  // input: key: url, values = [newurl1, newurl2....]
  // make values unique
  // all.store.get(key: 'visitedURLs')
  // if no error, this means that of (e, v), v = array of visited URLs
  // for each URL in values, check if in v ^^^; if in v, do nothing, if not in v,
  // return {key: [url1, url2, url3...]}

  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }
  let out = {};
  values = values.filter(onlyUnique).sort();
  out[key] = values;
  return out;
  // let newURLs = [];
  // global.distribution.local.store.get('visitedURLs', (e, v) => {
  //   // if visitedURLs doesn't exist, then create it
  //   if (e) {
  //     out[key] = values;
  //     global.distribution.local.store.put(out, 'visitedURLs', (e, v) => {
  //       if (e) {
  //         console.log(e);
  //       } else {
  //         return out;
  //       }
  //     });
  //   } else {
  //     // if visitedURLs exists, then v is the array of visitedURLs
  //     for (let i = 0; i < values.length; i++) {
  //       if (!v.includes(values[i])) {
  //         newURLs.push(values[i]);
  //       }
  //     }

  //     out[key] = newURLs;

  //     return out;
  //   }
  // });
};

module.exports = crawler;
