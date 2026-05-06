export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const {
    nome, email, whatsapp, instagram,
    faturamento, segmento,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content
  } = req.body;

  const API_KEY = process.env.PIPEDRIVE_API_KEY;
  const BASE    = 'https://api.pipedrive.com/v1';

  try {
    const personRes = await fetch(`${BASE}/persons?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:  nome,
        email: [{ value: email,    primary: true }],
        phone: [{ value: whatsapp, primary: true }],
      }),
    });
    const person   = await personRes.json();
    const personId = person.data?.id;

    const dealRes = await fetch(`${BASE}/deals?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:     `${nome} — ${segmento}`,
        person_id: personId,
      }),
    });
    const deal   = await dealRes.json();
    const dealId = deal.data?.id;

    const nota = [
      `Instagram: ${instagram    || '—'}`,
      `Faturamento: ${faturamento  || '—'}`,
      `Segmento: ${segmento      || '—'}`,
      ``,
      `--- UTMs ---`,
      `Source: ${utm_source     || '—'}`,
      `Medium: ${utm_medium     || '—'}`,
      `Campaign: ${utm_campaign   || '—'}`,
      `Term: ${utm_term        || '—'}`,
      `Content: ${utm_content    || '—'}`,
    ].join('\n');

    await fetch(`${BASE}/notes?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content:   nota,
        deal_id:   dealId,
        person_id: personId,
      }),
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Erro Pipedrive:', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
