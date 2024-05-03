let looper = (arr, func, i, continuation) => {
  if (i >= arr.length) {
    continuation();
    return;
  }

  func(arr[i], (e, v) => {
    if (e) {
      console.log(`Error in looper for func ${func}: ${e}`);
    }

    looper(arr, func, i + 1, continuation);
  });
};

module.exports = {
  'looper': looper,
};
