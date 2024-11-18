const axios = require('axios');

// Funkce pro získání přístupového tokenu
async function getAccessToken() {
  const clientId = 'ARx-_vQlZkKKUhy_I5p-cQVSyTOQ_WJesjbsUF9jBjGVAHnA4f1G94tA20buTBDvY5hEB94QBRlAfI-p'; // Vložte své produkční CLIENT_ID
  const clientSecret = 'EIKJ3bJLZeLjQfMGZwrhip9HCRAIk824tT7SMiNhwGtFcWkP9e4g_npmmP-Zq8YvWYJi2AoFC5IFsoCl'; // Vložte své produkční CLIENT_SECRET

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://api.paypal.com/v1/oauth2/token',
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log("Access Token: ", response.data.access_token);  // Zobrazení tokenu pro testování
    return response.data.access_token;
  } catch (error) {
    console.error('Chyba při získání přístupového tokenu:', error.response?.data || error.message);
    throw error;
  }
}

// Funkce pro odeslání platby
async function sendPayment(accessToken, amount) {
  const paymentData = {
    sender_batch_header: {
      email_subject: 'Payment to Yourself',
      email_message: 'Peníze z videí.',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amount,
          currency: 'CZK',
        },
        receiver: 'luisganste@email.cz', // Vložte svůj PayPal email
        note: 'Payment from API',
      },
    ],
  };

  try {
    const response = await axios.post(
      'https://api.paypal.com/v1/payments/payouts',
      paymentData,
      {
        headers: {
    Authorization: `Bearer A21AAMFQODuoCS8KPf793kGAu9OwcFt_YRJ5suYcUjeLfDgw2t6_GtKr_5RdRf6wiLz6rz4ofyAdHV7CwgBYi6bloS5Y62pIQ`,

    'Content-Type': 'application/json'
}

      }
    );
    return response.data;
  } catch (error) {
    console.error('Chyba při zpracování platby:', error.response?.data || error.message);
    throw error;
  }
}

// Hlavní funkce pro zpracování platby
async function processPayment() {
  try {
    const accessToken = await getAccessToken();
    const paymentResponse = await sendPayment(accessToken, '50000.00'); // Odeslat 50000 CZK
    console.log('Platba úspěšná:', paymentResponse);
  } catch (error) {
    console.error('Chyba při zpracování platby:', error);
  }
}

processPayment();

