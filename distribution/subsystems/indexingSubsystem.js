let indexer = {};

indexer.map = (key, value) => {
  // 0) Variables
  let out = [];

  // 1) Clean the text
  value = value.replace(/[^a-zA-Z ]/g, '');
  value = value.toLowerCase();

  // 2) Tokenize the text
  let words = value.split(/(\s+)/).filter((e) => e !== ' ');

  // 3) Remove stopwords
  words = words.filter((w) => !global.stopwords.includes(w));

  // 4) Stem the words
  let stemmer = global.natural.PorterStemmer;
  words = words.map((w) => stemmer.stem(w));

  // 5) Create the index
  words.forEach((w) => {
    let o = {};
    o[w] = [1, key];
    out.push(o);
  });

  return out;
};

index.reduce = (key, values) => {
  // 0) Sum up the counts
  let sum = values.reduce((total, current) => total + current[0], 0);

  // 1) Return the result
  let out = {};
  out[key] = [sum, values[0][1]];
  return out;
};

module.exports = indexer;
