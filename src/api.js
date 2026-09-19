const API_BASE = '/api';

export async function sendSmsViaServer({ mode, ip, port, login, password, cloudUrl, cloudLogin, cloudPassword, phone, message }) {
  const res = await fetch(`${API_BASE}/complaints/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword,
      phone,
      message,
      channel: 'gateway_sms'
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка отправки SMS' }));
    throw new Error(err.error || 'Ошибка отправки SMS');
  }
  return res.json();
}

export async function testGatewayConnection({ mode, ip, port, login, password, cloudUrl, cloudLogin, cloudPassword }) {
  const res = await fetch(`${API_BASE}/gateway/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      ip,
      port,
      login,
      password,
      cloudUrl,
      cloudLogin,
      cloudPassword
    })
  });
  return res.json();
}
