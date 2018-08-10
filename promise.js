
const sleep = (time) => new Promise(resolve => {
    setTimeout(() => resolve(), time);
});

Promise.sleep = sleep;
Promise.prototype.sleep = function (time) {
    return this.then(result => sleep(time).then(() => result));
};

const defer = () => {
    const result = {};
    const promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    result.promise = promise;
    return result;
};

Promise.defer = defer;
