let crawler = {};

// can either make the url the key or value
crawler.map = (_key, value) => {
  return new Promise((resolve, reject) => {
    // before fetch, check if value/url is in the local.store; if it is not, then return
    // empty object or something (does mr account for returning empty object/not doing anything with it?)
    global.fetch(value)
        .then((response) => {
          return response.text();
        })
        .then((text) => {
          let out = {};
          // gid is always all
          // all.store.put(obj={url: value, text: convert(text)}, key=value+'-crawled'), puts url/text pair into store
          // do getURL (figure out this whole jsdom shit)
          // in map, this returns object with key of url: {url: [newUrl1, new Url2...]}
          out[value] = text;
          resolve(out);
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
  // push to some array, at the end, all.store.append(visitedurls, this array)
  // if error, all.store.put(key: 'visitedurls', values)
  // return {key: [url1, url2, url3...]}
  let out = {};
  out[key] = values;
  return out;
};

module.exports = crawler;
