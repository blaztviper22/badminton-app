const { Client, CheckoutAPI } = require('@adyen/api-library');
const config = require('config');
const { v4: uuidv4 } = require('uuid');

// initialize Adyen client
const client = new Client({
  apiKey: config.get('adyen').apiKey,
  environment: config.get('adyen').environment
});

/**
 * Process a payment through Adyen.
 * @param {number} amount - The amount to charge (in PHP).
 * @param {string} courtOwnerGcash - The GCash number of the court owner.
 * @returns {Promise<object>} The response from Adyen's payment processing.
 */
async function processPayment(amount, courtOwnerGcash, redirectUrl) {
  // Create the request object
  const paymentRequest = {
    merchantAccount: config.get('adyen').merchantAccount,
    amount: {
      currency: 'PHP',
      value: amount * 100 // amount in cents
    },
    paymentMethod: {
      type: 'gcash'
    },
    returnUrl: `${config.get('frontendUrl')}/${redirectUrl}`,
    reference: 'Reservation Payment'
  };

  const requestOptions = { idempotencyKey: uuidv4() };

  try {
    const checkoutAPI = new CheckoutAPI(client);
    const response = checkoutAPI.PaymentsApi.payments(paymentRequest, requestOptions);
    return response;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

module.exports = {
  client,
  processPayment
};
