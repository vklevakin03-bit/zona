import crypto from 'crypto';

const API_KEY = process.env.FF_API_KEY;
const API_SECRET = process.env.FF_API_SECRET;
const BASE_URL = 'https://ff.io/api/v2';

function sign(data) {
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(data)
    .digest('hex');
}

async function ffRequest(method, params = {}) {
  const body = JSON.stringify(params);
  const res = await fetch(`${BASE_URL}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-API-KEY': API_KEY,
      'X-API-SIGN': sign(body)
    },
    body
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;

  try {
    let result;

    if (action === 'ccies') {
      result = await ffRequest('ccies', {});
    } else if (action === 'price') {
      result = await ffRequest('price', {
        type: params.type,
        fromCcy: params.fromCcy,
        toCcy: params.toCcy,
        direction: params.direction,
        amount: params.amount
      });
    } else if (action === 'create') {
      result = await ffRequest('create', {
        type: params.type,
        fromCcy: params.fromCcy,
        toCcy: params.toCcy,
        direction: params.direction,
        amount: params.amount,
        toAddress: params.toAddress
      });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}
