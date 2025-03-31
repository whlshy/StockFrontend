const array2obj = (arr = [], key = "") => {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}

const reClassName = (str) => {
  return str?.replaceAll("<\\\\>", '/')
}

export {
  array2obj,
  reClassName,
};