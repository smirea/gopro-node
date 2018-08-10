require('colors');
require('./promise');

process.on('unhandledRejection', (error, promise) => {
    console.error('[ERROR] UnhandledPromiseRejectionWarning:'.red, error.stack || error);
    process.exit(1);
});
