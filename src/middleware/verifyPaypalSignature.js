const crypto = require('crypto');
const config = require('config');

// middleware to verify PayPal webhook signature
function verifyPayPalSignature(req, res, next) {
  const signature = req.headers['paypal-transmission-sig'];
  const transmissionId = req.headers['paypal-transmission-id'];
  const timestamp = req.headers['paypal-transmission-time'];
  const webhookId = config.get('paypal').paypalWebhookId;
  const authAlgo = req.headers['paypal-auth-algo'];
  const certUrl = req.headers['paypal-cert-url'];

  // validate required headers
  if (!signature || !transmissionId || !timestamp || !webhookId || !authAlgo || !certUrl) {
    return res.status(400).send('Missing or invalid headers');
  }

  // create a verification object
  const verifier = crypto.createVerify(authAlgo);

  // prepare the data for verification
  const data = `${webhookId}${transmissionId}${timestamp}`;
  verifier.update(data);

  // verify the signature using the PayPal certificate URL
  const isValid = verifier.verify(certUrl, signature, 'base64');

  if (!isValid) {
    return res.status(400).send('Invalid PayPal signature');
  }

  // proceed to the next middleware or route handler if valid
  next();
}

module.exports = verifyPayPalSignature;
