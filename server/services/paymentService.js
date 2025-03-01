import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOOMONEY_API_URL = 'https://api.yookassa.ru/v3/payments';
const SHOP_ID = process.env.YOOMONEY_SHOP_ID;
const SECRET_KEY = process.env.YOOMONEY_SECRET_KEY;

export async function createPayment(amount, description) {
  try {
    const paymentData = {
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      payment_method_data: { type: 'bank_card' },
      capture: true,
      description,
      test: true,
    };

    const response = await axios.post(YOOMONEY_API_URL, paymentData, {
      auth: { username: SHOP_ID, password: SECRET_KEY },
      headers: { 'Content-Type': 'application/json' },
    });

    return { payment_url: response.data.confirmation.confirmation_url };
  } catch (error) {}
}


