const commonConfig = require('./commonConfig');

module.exports = {
  ...commonConfig,
  tlsAllowInvalidCertificates: false,
  host: process.env.HOST_PROD || '0.0.0.0',
  adyen: {
    ...commonConfig.adyen,
    environment: 'LIVE'
  },
  paypal: {
    ...commonConfig.paypal,
    apiBaseUrl: 'https://api-m.paypal.com'
  }
};
