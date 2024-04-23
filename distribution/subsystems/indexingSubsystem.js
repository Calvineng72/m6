let indexer = {};

indexer.map = (key, value) => {
  // 1) Clean the text
  value = value.replace(/[^a-zA-Z ]/g, '').toLowerCase();

  // 2) Tokenize the text
  let words = value.split(/(\s+)/).filter((e) => e !== ' ');

  // 3) Remove stopwords
  words = words.filter((w) => !global.stopwords.includes(w));

  // 4) Stem the words and return
  let stemmer = global.natural.PorterStemmer;
  return words.map((word) =>
    ({[stemmer.stem(word)]: {count: 1, url: key}}));

  // // 5) Create the index
  // words.forEach((w) => {
  //   let o = {};
  //   o[w] = {count: 1, url: key};
  //   out.push(o);
  // });

  // return out;
};

// Input: {word: [{'url': url1, 'count': count1}, ...]}
// Output: {word: {url1: count1, ...}}
// This allows us to easily query the results since we can
// just look up the word and then combine the counts to get a
// search total for each url.
indexer.reduce = (key, values) => {
  // 1) Create a new map between urls and counts
  const urlMap = {};
  for (const value of values) {
    const url = value['url'];
    const count = value['count'];
    if (urlMap[url]) {
      urlMap[url] += count;
    } else {
      urlMap[url] = (urlMap[url] || 0) + count;
    }
  }

  // 2) Return the results
  return {[key]: urlMap};
};

module.exports = indexer;
