let invertedIndex = {};

invertedIndex.map = (key, value) => {
  let words = value.split(/(\s+)/).filter((e) => e !== ' ');
  let out = [];
  words.forEach((w) => {
    let o = {};
    o[w] = [1, key];
    out.push(o);
  });
  return out;
};

invertedIndex.reduce = (key, values) => {
  let sum = values.reduce((total, current) => total + current[0], 0);
  let out = {};
  out[key] = [sum, values[0][1]];
  return out;
};

module.exports = invertedIndex;
