
const GoPro = require('goproh4');
const _ = require('lodash');

const STATUS_URL = 'http://10.5.5.9/gp/gpControl/info';
// get it from the STATUS_URL
const MAC_ADDRESS = [ 'd4', 'd9', '19', 'cf', '30', 'ae' ];

const cam = new GoPro.Camera({
    mac: MAC_ADDRESS,
});

const camSet = async diff => {
    const runList = [];

    const mapping = {
        VIDEO_FPS: 'VideoFPS',
    };

    for (let key in diff) {
        const id = GoPro.Settings[key];
        console.assert(id != null, `Invalid setting: ${id}`);

        const optionsKey = mapping[key] || _.upperFirst(_.camelCase(key));
        const options = GoPro.Settings[optionsKey];
        console.assert(options != null, `Invalid optionsKey "${optionsKey}" from "${key}"`);

        const value = options[diff[key]];
        console.assert(value != null, `Invalid option "${diff[key]}" for "${key}"`);
        runList.push([ id, value, key, diff[key] ]);
    }

    for (let [ id, value, name, valueName ] of runList) {
        console.log('   → %s: %s', name, valueName);
        await cam.set(id, value);
    }
};

// this also seems to wake up the device wifi, so good idea to run in as the fist thing on init
const getCamStatus = async () => {
    try {
        return JSON.parse('' + execSync(`curl -s --connect-timeout 1 ${STATUS_URL}`))
    } catch (ex) {
        return null;
    }
}

module.exports = {
    GoPro,
    STATUS_URL,
    cam,
    camSet,
    getCamStatus,
};
