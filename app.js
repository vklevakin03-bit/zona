let currentType = 'fixed';
let priceTimer = null;
let lastDirection = 'from';

// Загрузка списка валют
async function loadCurrencies() {
  try {
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ccies' })
    });
    const data = await res.json();
    if (data.code !== 0) return;

    const currencies = data.data
      .filter(c => c.recv && c.send)
      .sort((a, b) => a.priority - b.priority);

    const fromSelect = document.getElementById('fromCcy');
    const toSelect = document.getElementById('toCcy');
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    currencies.forEach(c => {
      const label = `${c.coin} (${c.network})`;
      fromSelect.innerHTML += `<option value="${c.code}">${label}</option>`;
      toSelect.innerHTML += `<option value="${c.code}">${label}</option>`;
    });

    // Дефолт: BTC → ETH
    fromSelect.value = currencies.find(c => c.coin === 'BTC')?.code || currencies[0].code;
    toSelect.value = currencies.find(c => c.coin === 'ETH')?.code || currencies[1].code;

    getPrice();
  } catch (e) {
    showError('Ошибка загрузки валют');
  }
}

// Тип курса
function setType(type) {
  currentType = type;
  document.getElementById('btn-fixed').classList.toggle('active', type === 'fixed');
  document.getElementById('btn-float').classList.toggle('active', type === 'float');
  getPrice();
}

// Ввод суммы "Отдаю"
function onFromInput() {
  lastDirection = 'from';
  clearTimeout(priceTimer);
  priceTimer = setTimeout(getPrice, 600);
}

// Ввод суммы "Получаю"
function onToInput() {
  lastDirection = 'to';
  clearTimeout(priceTimer);
  priceTimer = setTimeout(getPrice, 600);
}

// Смена валюты
function onCcyChange() {
  clearTimeout(priceTimer);
  priceTimer = setTimeout(getPrice, 300);
}

// Получение курса
async function getPrice() {
  const fromCcy = document.getElementById('fromCcy').value;
  const toCcy = document.getElementById('toCcy').value;
  const fromAmount = parseFloat(document.getElementById('fromAmount').value);
  const toAmount = parseFloat(document.getElementById('toAmount').value);

  const amount = lastDirection === 'from'
    ? (fromAmount || 1)
    : (toAmount || 1);

  setRateInfo('Загрузка курса...');
  showError('');

  try {
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'price',
        type: currentType,
        fromCcy,
        toCcy,
        direction: lastDirection,
        amount
      })
    });

    const data = await res.json();

    if (data.code !== 0) {
      setRateInfo('');
      showError(data.msg || 'Ошибка получения курса');
      return;
    }

    const from = data.data.from;
    const to = data.data.to;

    if (lastDirection === 'from') {
      document.getElementById('toAmount').value = to.amount;
    } else {
      document.getElementById('fromAmount').value = from.amount;
    }

    setRateInfo(`1 ${from.coin} ≈ ${to.rate} ${to.coin}`);

  } catch (e) {
    showError('Ошибка соединения');
  }
}

// Создание заказа
async function createOrder() {
  const fromCcy = document.getElementById('fromCcy').value;
  const toCcy = document.getElementById('toCcy').value;
  const fromAmount = parseFloat(document.getElementById('fromAmount').value);
  const toAddress = document.getElementById('toAddress').value.trim();

  showError('');

  if (!fromAmount || fromAmount <= 0) {
    showError('Введи сумму');
    return;
  }
  if (!toAddress) {
    showError('Введи адрес получателя');
    return;
  }

  const btn = document.querySelector('.exchange-btn');
  btn.textContent = 'Создаём заказ...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      …
