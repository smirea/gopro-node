
const axios = require('axios');

const monkeyPatch = () => {
    const result = axios;

    const dataProps = [ 'get', 'post' ];
    for (let key of dataProps) {
        const old = axios[key];
        result[key] = (...args) => old(...args).then(res => res.data);
    }

    return result;
}

module.exports = monkeyPatch();
