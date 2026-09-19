/**
 * SMS Gateway Service
 * Supports Capcom6's open-source Android SMS Gateway (https://github.com/capcom6/android-sms-gateway)
 * Supports both Local Server (Wi-Fi) and Cloud Server (api.sms-gate.app).
 * Optimized for Uzbekistan (+998).
 */

export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  // Strip all non-digit and non-plus characters
  let clean = rawPhone.replace(/[^\d+]/g, '');

  // If local 9 digits in Uzbekistan (e.g. 901234567) -> +998901234567
  if (/^\d{9}$/.test(clean)) {
    return '+998' + clean;
  }

  // If starts with 998 and has 12 digits without +: 998901234567 -> +998901234567
  if (clean.startsWith('998') && clean.length === 12) {
    return '+' + clean;
  }

  // If starts with +998
  if (clean.startsWith('+998')) {
    return clean;
  }

  // General fallback: if no plus and has digits
  if (!clean.startsWith('+') && clean.length >= 9) {
    clean = '+' + clean;
  }

  return clean;
}

export function generateSmsUrl(phone, message) {
  const normalized = normalizePhone(phone);
  return `sms:${normalized}?body=${encodeURIComponent(message)}`;
}

export async function sendSmsViaGateway({ mode = 'local', ip, port, login, password, cloudUrl, cloudLogin, cloudPassword, phone, message }) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new Error('Указан неверный номер телефона');
  }

  let endpoint = '';
  let authLogin = '';
  let authPassword = '';

  if (mode === 'cloud') {
    endpoint = cloudUrl || 'https://api.sms-gate.app/3rdparty/v1/message';
    authLogin = cloudLogin;
    authPassword = cloudPassword;
  } else {
    // Local server
    let host = (ip || '192.168.100.119').trim();
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `http://${host}`;
    }
    endpoint = `${host}:${port || 8080}/message`;
    authLogin = login;
    authPassword = password;
  }

  const authHeader = 'Basic ' + Buffer.from(`${authLogin}:${authPassword}`).toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        message: message,
        phoneNumbers: [normalizedPhone]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ошибка шлюза (HTTP ${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json().catch(() => ({ status: 'ok' }));
    return {
      success: true,
      data
    };
  } catch (err) {
    clearTimeout(timeoutId);
    let userMsg = err.message;
    if (err.name === 'AbortError') {
      userMsg = 'Таймаут подключения (12 сек). Телефон или облачный сервер недоступен.';
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      if (mode === 'cloud') {
        userMsg = 'Не удалось связаться с Cloud SMS Gate. Проверьте интернет на телефоне и компьютере.';
      } else {
        userMsg = `Не удалось подключиться к ${endpoint}. Проверьте, включен ли Wi-Fi и запущен ли Локальный сервер на телефоне.`;
      }
    }
    return {
      success: false,
      error: userMsg
    };
  }
}

export async function testGatewayConnection({ mode = 'local', ip, port, login, password, cloudUrl, cloudLogin, cloudPassword }) {
  let endpoint = '';
  let authLogin = '';
  let authPassword = '';

  if (mode === 'cloud') {
    endpoint = cloudUrl || 'https://api.sms-gate.app/3rdparty/v1/message';
    authLogin = cloudLogin;
    authPassword = cloudPassword;
  } else {
    let host = (ip || '192.168.100.119').trim();
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `http://${host}`;
    }
    endpoint = `${host}:${port || 8080}/`;
    authLogin = login;
    authPassword = password;
  }

  const authHeader = 'Basic ' + Buffer.from(`${authLogin}:${authPassword}`).toString('base64');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: mode === 'cloud' ? 'HEAD' : 'GET',
      headers: {
        'Authorization': authHeader
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return {
      success: true,
      status: response.status,
      message: `Подключение успешно! Ответ сервера: HTTP ${response.status}`
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: `Ошибка проверки связи: ${err.message}. Проверьте введенные данные и статус сервера в приложении.`
    };
  }
}
