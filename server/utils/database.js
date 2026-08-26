const mongoose = require('mongoose');

const isDatabaseReady = () => mongoose.connection.readyState === 1;

module.exports = { isDatabaseReady };