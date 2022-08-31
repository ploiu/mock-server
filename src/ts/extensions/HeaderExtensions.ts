Headers.prototype.toJSON = function () {
  return Object.fromEntries([...this]);
};
