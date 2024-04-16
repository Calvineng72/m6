let crawler = {};

crawler.map = (_key, value) => {
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

crawler.reduce = (key, values) => {
  let out = {};
  out[key] = values;
  return out;
};

module.exports = crawler;
