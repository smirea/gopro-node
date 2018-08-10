const axios = require('./lib/axios');
const { spawn } = require('child_process');
const utils = require('./utils');

const TIME = 2; // in hours
const OFFSET_RATIO = 0.25; // 0 → 1
// const IP_URL = 'https://api.ipify.org';
// const LOCATION_URL = 'https://ipstack.com/ipstack_api.php?ip=';
const SUNRISE_URL = 'https://api.sunrise-sunset.org/json?formatted=0&lat=40.7805&lng=-73.9512'

const init = async () => {
    const sunrise = await getSunrise();
    console.log('Sunrise ☀  %s'.yellow, timeF(sunrise));
    const startTime = new Date(sunrise.getTime() - TIME * 3600 * OFFSET_RATIO * 1000);
    const args = [
        'timelapse.js',
        timeF(startTime),
        `${f(Math.floor(TIME))}:${f((TIME % 1) * 60)}`
    ];
    spawn('node', args, { stdio: 'inherit' });
}

const f = num => ('0' + num).slice(-2);
const timeF = date => `${f(date.getHours())}:${f(date.getMinutes())}`;

const getSunrise = async () => {
    const response = await axios.get(SUNRISE_URL);
    if (response.status !== 'OK') throw `Could not get sunrise time`;
    return new Date(response.results.sunrise);
}

init();
