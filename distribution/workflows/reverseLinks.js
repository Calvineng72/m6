let reverseLinks = {};

reverseLinks.map = (key, value) => {
  let out = {};
  out[value] = key;
  return out;
};

reverseLinks.reduce = (key, values) => {
  return {[key]: values};
};

module.exports = reverseLinks;
