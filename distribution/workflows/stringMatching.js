let stringMatching = (pattern) => {
  return {
    map: (key, value) => {
      const regex = new RegExp(pattern, 'g');
      const matches = value.matchAll(regex);
      let out = [];
      for (const match of matches) {
        let o = {};
        o[key] = match[0];
        out.push(o);
      }
      return out;
    },
    reduce: (key, values) => {
      return {[key]: values};
    },
  };
};

module.exports = stringMatching;
