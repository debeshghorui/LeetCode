// Sentry's Metro config uploads source maps. Web session replay stays off.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname, {
    includeWebReplay: false,
});

module.exports = config;
