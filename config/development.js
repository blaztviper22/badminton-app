const commonConfig = require('./commonConfig');

module.exports = {
  ...commonConfig,
  tlsAllowInvalidCertificates: true,
  host: process.env.HOST_DEV || '127.0.0.1',
  adyen: {
    ...commonConfig.adyen,
    environment: 'TEST'
  },
  paypal: {
    ...commonConfig.paypal,
    apiBaseUrl: 'https://api-m.sandbox.paypal.com'
  }
};
