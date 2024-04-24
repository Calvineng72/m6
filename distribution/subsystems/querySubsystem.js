function query(search, callback) {
  // 1) Clean the serach
  search = search.replace(/[^a-zA-Z ]/g, '').toLowerCase();
  let words = search.split(/(\s+)/).filter((e) => e !== ' ');
  words = words.filter((word) => !global.stopwords.includes(word));

  // 2) Stem the words to access the data
  let stemmer = global.natural.PorterStemmer;
  words = words.map((word) => stemmer.stem(word));

  // 3) Search for the words
  let length = words.length;
  const counts = {};
  for (const word of words) {
    const wordID = distribution.util.id.getID(word);
    distribution.all.store.get(wordID, (error, value) => {
      if (!error) {
        const results = value[word];
        for (const [url, count] of Object.entries(results)) {
          if (counts[url]) {
            counts[url] += count;
          } else {
            counts[url] = count;
          }
        }
      }

      length--;
      if (length === 0) {
        returnResults();
      }
    });
  }

  // 4) Return the results (URL with most counts)
  function returnResults() {
    let max = 0;
    let topURL = '';
    for (const [url, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        topURL = url;
      }
    }

    callback(topURL);
  }
}

module.exports = query;
