const {JSDOM} = require('jsdom');
const {URL} = require('url');

let getURLs = {};

getURLs.map = (key, value) => {
  // assumes key: url, value: HTML text/obj
  const originalURL = key;
  const dom = new JSDOM(value);
  const document = dom.window.document;
  let s = new Set();
  let out = {};
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

  out[originalURL] = o;
  return out;
};

getURLs.reduce = (key, values) => {
  // idk how to check with the distributed store system on whether the urls are
  // already in the need-to-visit url file or have already been visited
  // bc im assuming that will need a gid. i dont even KNOWWWWWW
  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }
  let out = {};
  out[key] = values.filter(onlyUnique).sort();
  return out;
};
