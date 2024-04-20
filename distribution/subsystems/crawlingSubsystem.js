const id = require("../util/id");

let crawler = {};

// NOTE: I think that either the shuffle or reduce phase must have 
// redunant local.comm.send calls with the data, i.e., the data is sent
// to the node it is already on.

// INPUT IS {oldURL: newURL}, BUT WE ONLY CARE ABOUT NEW HERE
// EX. {'google.com': 'google.com/page1'}
// Starting page ex: {'google.com': 'google.com'}
crawler.map = (_key, value) => {
  // 0) Variables
  const newURL = value;
  const newID = id.getID(newURL);


  // 1) Check if the page has already been visited
  if (global.visited.has(newURL)) {
    return null;
  } else {
    global.visited.add(newURL);
  }


  // 2) Fetch the page with sync-fetch
  const html = global.fetch(newURL).text();


  // 3) Convert the HTML to text and store text with store
  const text = global.convert(html);
  const textKey = newID + ':text';
  distributed.all.store(text, textKey, (e, _v) => {
    if (e) return null;
  });

  
  // 4) Parse the HTML for links
  const dom = new global.JSDOM(html);
  const document = dom.window.document;

  let out = {};
  let links = [];
  let seen = new Set();

  for (const link of document.links) {
    if (!seen.has(link.href)) {
      let fullURL = originalURL;
      if (link.href.charAt(0) == '/') {
        if (originalURL.charAt(originalURL.length - 1) == '/') {
          fullURL = new global.URL(
              link.href,
              originalURL.substring(0, originalURL.length - 1),
          );
        } else {
          fullURL = new global.URL(link.href, originalURL);
        }
      } else {
        fullURL = new global.URL(link.href);
      }
      seen.add(link.href);
      links.push(fullURL.toString());
    }
  }


  // 5) Return the links ({newURL: [url1, url2, ...]})
  // EX. {'google.com/page1': ['google.com/page2', 'google.com/page3']}
  out[newURL] = links;
  return out;
};

crawler.reduce = (key, values) => {
  // After shuffling, the input is {newURL: [url1, url2, ...]} since the
  // append function in local.store.js only adds to the array for the key
  // NOTE: the "newURL" becomes the "oldURL" in this phase
  // NOTE: the shuffle phase should not need to "append," it merely sends
  // the data to the node responsible for the newURL

  // 0) Variables
  const oldURL = key;
  const oldID = id.getID(oldURL);


  // 1) Store the links for reverse web link graph
  // NOTE: we need to discuss how to do this/what the format should be
  const linksKey = oldID + ':links';
  distributed.all.store(values, linksKey, (e, _v) => {
    if (e) return null;
  });


  // 2) Return the links for the next iteration
  let out = [];
  for (const newURL of values) {
    let newInfo = {};
    newInfo[oldURL] = newURL;
    out.push(newInfo);
  }
  return out;
};

module.exports = crawler;
