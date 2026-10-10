const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname, {
    includeWebReplay: false,
});

module.exports = config;
