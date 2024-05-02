function query(search, callback) {
  // 1) Clean the serach
  search = search.replace(/[^a-zA-Z ]/g, '').toLowerCase();
  let words = search.split(/(\s+)/).filter((e) => e !== ' ');
  words = words.filter((word) => !global.stopwords.includes(word));

  console.log(words);

  // 2) Stem the words to access the data
  let stemmer = global.natural.PorterStemmer;
  words = words.map((word) => stemmer.stem(word));

  console.log(words);

  // 3) Search for the words
  let length = words.length;
  const counts = {};
  for (const word of words) {
    const wordID = distribution.util.id.getID(word);
    distribution.all.store.get(wordID, (error, value) => {
      length--;
      if (!error) {
        const results = value[word];
        for (let i = 0; i < results.length; i++) {
          let url = results[i]['url'];
          let count = results[i]['count'];
          if (counts[url]) {
            counts[url] += count;
          } else {
            counts[url] = count;
          }
        }
      }

      if (length === 0) {
        returnResults();
      }
    });
  }

  // 4) Return the results (URL with most counts)
  function returnResults() {
    let t = [];
    for (var prop in counts) {
      t.push([counts[prop], prop]);
    }

    t = t.sort(function(a, b) {
      return b[0] - a[0];
    });

    let output = [];

    for (let i = 0; i < Math.min(t.length, 10); i++) {
      output.push(t[i][1]);
    }

    callback(output);
  }
}

module.exports = query;
