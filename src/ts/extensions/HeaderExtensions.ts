// @ts-ignore I'm extending it, of course it doesn't exist here
Headers.prototype.toJSON = function () {
  return Object.fromEntries([...this]);
};
