// utils/queue.js

let queue;

const queuePromise = import('p-queue').then(({ default: PQueue }) => {
  queue = new PQueue({
    concurrency: 1,
    interval: 1000,
    intervalCap: 1,
  });
  return queue;
});

module.exports = {
  add: async (...args) => {
    if (!queue) await queuePromise;
    return queue.add(...args);
  },
  onEmpty: async () => {
    if (!queue) await queuePromise;
    return queue.onEmpty();
  },
  onIdle: async () => {
    if (!queue) await queuePromise;
    return queue.onIdle();
  }
};
