let crawler = {};

// NOTE: I think that either the shuffle or reduce phase must have
// redunant local.comm.send calls with the data, i.e., the data is sent
// to the node it is already on.

// INPUT IS {newURL: oldURL}, BUT WE ONLY CARE ABOUT NEW HERE --> renamed to url
// EX. {'google.com': 'google.com/page1'}
// Starting page ex: {'google.com': 'google.com'}
crawler.map = (key, _value) => {
  // 0) Variables
  const url = key;
  const newID = distribution.util.id.getID(url);

  // console.log('15555555 ' + url);


  // 1) Check if the page has already been visited
  if (global.visited.has(url)) {
    return null;
  } else {
    global.visited.add(url);
  }


  // 2) Fetch the page with sync-fetch
  let html;
  try {
    html = global.fetch(url).text();
  } catch (e) {
    return null;
  }

  // 3) Convert the HTML to text and store text with store
  const text = global.convert(html);

  // console.log('344444444 ' + html);

  const textKey = `${newID}-text`;
  const textInfo = {};
  textInfo[url] = text;
  distribution.all.store.put(textInfo, textKey, (e, _v) => {
    if (e) return null;
  });

  // 4) Parse the HTML for links
  const dom = new global.JSDOM(html);
  const document = dom.window.document;

  let out = {};
  let links = [];
  let seen = new Set();

  // for (const link of document.links) {
  //   if (!seen.has(link.href)) {
  //     let fullURL = url;
  //     if (link.href.charAt(0) == '/') {
  //       if (url.charAt(url.length - 1) == '/') {
  //         fullURL = new global.URL(
  //             link.href,
  //             url.substring(0, url.length - 1),
  //         );
  //       } else {
  //         fullURL = new global.URL(link.href, url);
  //       }
  //     } else {
  //       fullURL = new global.URL(link.href);
  //     }
  //     seen.add(link.href);
  //     links.push(fullURL.toString());
  //   }
  // }
  for (const link of document.links) {
    if (!seen.has(link.href)) {
      let fullURL;
      try {
        if (link.href.charAt(0) == '/') {
          if (url.charAt(url.length - 1) == '/') {
            fullURL = new global.URL(
                link.href,
                url.substring(0, url.length - 1),
            );
          } else {
            fullURL = new global.URL(link.href, url);
          }
        } else {
          fullURL = new global.URL(link.href);
        }
        seen.add(link.href);
        links.push(fullURL.toString());
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  }


  // 5) Return the links ({newURL: [url1, url2, ...]})
  // EX. {'google.com/page1': ['google.com/page2', 'google.com/page3']}
  out[url] = links;
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
  const oldID = distribution.util.id.getID(oldURL);
  values = values.flat();

  // 1) Store the links for reverse web link graph
  // NOTE: we need to discuss how to do this/what the format should be
  const linksKey = `${oldID}-links`;
  const linksInfo = {oldURL: oldURL, links: values};
  distribution.all.store.put(linksInfo, linksKey, (e, _v) => {
    if (e) return null;
  });

  // 2) Return the links for the next iteration
  let out = [];
  values = values.filter(
      (value, index, array) => array.indexOf(value) === index,
  );

  values = values.filter((word) => word != oldURL);
  values = values.filter((word) => word.length >= 25 && word.substring(0, 25) === 'https://www.gutenberg.org');
  for (const newURL of values) {
    let newInfo = {};
    newInfo[newURL] = oldURL;
    out.push(newInfo);
  }
  return out;
};

module.exports = crawler;
