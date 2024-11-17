const axios = require('axios');

async function getAccessToken() {
  const clientId = '';
 
  const clientSecret = ''; 
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await axios.post('https://api.paypal.com/v1/oauth2/token', 
    'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  return response.data.access_token;
}

async function sendPayment(accessToken, amount) {
  const paymentData = {
    sender_batch_header: {
      email_subject: 'Mzda',
      email_message: 'penize z prodeje.'
    },
    items: [{
      recipient_type: 'EMAIL',
      amount: {
        value: amount,
        currency: 'CZK'
      },
      receiver: ', // Zde zadejte svuj e-mail na PayPal
      note: 'Payment from API'
    }]
  };

  const response = await axios.post('https://api.paypal.com/v1/payments/payouts', paymentData, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });

  return response.data;
}

async function processPayment() {
  try {
    const accessToken = await getAccessToken();
    const paymentResponse = await sendPayment(accessToken, 5000.00); // Pošlete 50000 CZK
    console.log(paymentResponse);
  } catch (error) {
    console.error('Chyba pri zpracování platby:', error.response ? error.response.data : error.message);
  }
}


