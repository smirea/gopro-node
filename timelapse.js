#!/usr/bin/env node

const utils = require('./utils');
const makeLineStatus = require('./makeLineStatus');
const path = require('path');
const { execSync } = require('child_process');
const _ = require('lodash');
const axios = require('./lib/axios');
const { STATUS_URL, cam, GoPro, camSet } = require('./lib/cam');

let [ , scriptName, startTime, duration ] = process.argv;
let endTime;

const init = async () => {
    initTime();

    try {
        if (JSON.parse('' + execSync(`curl -s --connect-timeout 1 ${STATUS_URL}`))) {
            console.log(' → powering off');
            await cam.powerOff();
        }
    } catch (ex) {}

    console.log(`Start: ${getTimeFormat(startTime)}`.cyan);
    console.log(`End: ${getTimeFormat(endTime)}`.cyan);
    await countdown('Time to start:'.bold, startTime);

    console.log(' → powerOn');
    await cam.powerOn();

    console.log(' → setup');
    await cam.mode(GoPro.Settings.Modes.Video, GoPro.Settings.Submodes.Burst.Timelapse);
    await camSet({
        VIDEO_RESOLUTION: 'R4K',
        VIDEO_FPS: 'F15',
        VIDEO_TIMELAPSE_INTERVAL: 'I10S',
        BURST_RATE: 'R30P2S',
    })

    console.log(' → start video');
    await cam.start();
    await countdown('Recording timelapse:'.bold, endTime);

    console.log(' → done'.green);

    console.log(' → downloading video');
    const mediaDir = _.find((await cam.listMedia()).media, { d: '100GOPRO' });
    if (mediaDir) {
        const file = _.last(mediaDir.fs).n;
        const localPath = `downloads/${file}`;
        execSync('mkdir -p downloads');
        console.log(`   → copying ${localPath}`)
        await cam.getMedia('100GOPRO', file, localPath);
    } else {
        console.error(' → could not find media dir'.red);
    }

    console.log(' → powerOff');
    await cam.stop();
    await cam.powerOff();
}

const initTime = () => {
    startTime = parseTime(startTime);
    console.assert(startTime, usage('invalid startTime'));

    duration = parseTime(duration);
    console.assert(duration, usage('invalid duration'));

    const start = new Date;
    start.setSeconds(0);
    start.setHours(startTime.h);
    start.setMinutes(startTime.m);
    start.setSeconds(startTime.s);

    if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);

    startTime = start;
    endTime = new Date(
        Math.max(Date.now(), start.getTime()) +
        (duration.h * 3600 + duration.m * 60 + duration.s) * 1000
    );
}

const usage = msg =>
    [
        `${msg}`.red,
        `${'usage:'.bold} ${path.basename(scriptName)} startTime duration`.yellow,
        ` - time format: hh:mm`.yellow,
    ].join('\n');

const getTimeFormat = d => {
    const { hF, mF, sF } = getTime(d);
    return `${hF}:${mF}:${sF}`;
}

const getTime = (d = new Date) => {
    const f = num => ('0' + num).slice(-2);
    return {
        h: d.getHours(),
        m: d.getMinutes(),
        s: d.getSeconds(),
        hF: f(d.getHours()),
        mF: f(d.getMinutes()),
        sF: f(d.getSeconds()),
    };
}

const parseTime = str => {
    if (!str) return null;

    let [ hF, mF, sF = '00' ] = str.split(':');
    const h = parseInt(hF, 10);
    const m = parseInt(mF, 10);
    const s = parseInt(sF, 10);

    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(sF)) return null;

    return { h, m, s, hF, mF, sF };
}

const countdown = (message, date) => {
    const defer = Promise.defer();
    const status = makeLineStatus('@message @h:@m:@s', { message });

    const update = () => {
        const delta = (date.getTime() - Date.now()) / 1000;

        if (delta <= 0) {
            status.set({ h: '00', m: '00', s: '00' });
            clearInterval(interval);
            defer.resolve();
            status.clear();
            return;
        }

        const f = num => ('0' + num).slice(-2);
        const h = f(Math.floor(delta / 3600));
        const m = f(Math.floor(delta % 3600 / 60));
        const s = f(Math.floor(delta % 60));
        status.set({ h, m, s });
    };

    const interval = setInterval(update, 1000);
    update();

    return defer.promise;
}

init()
.catch(ex => {
    console.error(ex.stack || ex.message || ex);
    return 1;
})
.then(code => {
    process.exit(code);
});
