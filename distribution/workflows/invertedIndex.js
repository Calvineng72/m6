let invertedIndex = (url) => {
  return {
    map: (_key, value) => {
      let out = {};
      out[value] = [1, url];
      return out;
    },
    reduce: (key, values) => {
      let sum = values.reduce((total, current) => total + current[0], 0);
      let out = {};
      out[key] = [sum, values[0][1]];
      return out;
    },
  };
};

module.exports = invertedIndex;
