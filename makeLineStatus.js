
const readline = require('readline');

const makeLineStatus = (str, defaults = {}) => {
    const chunks = [];
    const data = Object.assign({}, defaults);
    const reg = /@[a-z0-9]+/g;

    let last = 0;
    let match;
    while (match = reg.exec(str)) {
        if (last !== match.index) {
            const text = str.slice(last, match.index);
            chunks.push(() => text);
        }
        const val = match[0];
        const name = val.slice(1);
        chunks.push(() => data[name]);
        data[name] = data[name] == null ? '' : data[name];
        last = match.index + val.length;
    }

    chunks.push(() => '\n');
    let lastLine = '';

    const clear = () => {
        if (lastLine) readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
    };

    const update = () => {
        clear();
        lastLine = chunks.map(fn => fn()).join('');
        process.stdout.write(lastLine);
    };

    update();

    return {
        set: (name, value) => {
            if (name && typeof name === 'object') {
                for (let key in name) data[key] = name[key];
            } else data[name] = value;
            update();
        },
        get: name => data[name],
        clear,
        update,
    };
}

module.exports = makeLineStatus;
