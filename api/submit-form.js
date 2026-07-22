// api/submit-form.js
// Endpoint para o formulário de qualificação da Aidar Mídia Digital

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const {
      nome,
      whatsapp,
      email,
      instagram,
      faturamento,
      segmento,
      investiu_trafego,
      verba_mensal,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = req.body

    const API_KEY     = process.env.PIPEDRIVE_API_KEY
    const BASE        = 'https://api.pipedrive.com/v1'
    const PIPELINE_ID = 2 // Pipeline de vendas — Aidar Mídia Digital

    // 0. Buscar stage_id automaticamente pelo nome "Leads"
    const stagesRes  = await fetch(`${BASE}/stages?pipeline_id=${PIPELINE_ID}&api_token=${API_KEY}`)
    const stagesData = await stagesRes.json()
    const leadsStage = stagesData.data?.find(s => s.name === 'Leads')
    const stageId    = leadsStage?.id

    // 1. Criar Person
    const personRes = await fetch(`${BASE}/persons?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:  nome,
        phone: [{ value: whatsapp, primary: true }],
        email: [{ value: email,    primary: true }],
      }),
    })
    const personData = await personRes.json()
    const personId   = personData.data?.id

    // 2. Criar Deal
    const dealRes = await fetch(`${BASE}/deals?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       `${nome} — ${faturamento}`,
        person_id:   personId,
        pipeline_id: PIPELINE_ID,
        stage_id:    stageId,
        status:      'open',
      }),
    })
    const dealData = await dealRes.json()
    const dealId   = dealData.data?.id

    // 3. Criar Nota
    const nota = `Instagram: ${instagram || '(não informado)'}
Faturamento: ${faturamento || '(não informado)'}
Segmento: ${segmento || '(não informado)'}
Já investiu em tráfego: ${investiu_trafego || '(não informado)'}
Verba mensal de anúncios: ${verba_mensal || '(não informado)'}
WhatsApp: ${whatsapp}
Email: ${email}

--- UTMs ---
Source: ${utm_source   || '(direto)'}
Medium: ${utm_medium   || '(nenhum)'}
Campaign: ${utm_campaign || '(nenhuma)'}
Term: ${utm_term     || '(nenhum)'}
Content: ${utm_content  || '(nenhum)'}`

    await fetch(`${BASE}/notes?api_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content:   nota,
        deal_id:   dealId,
        person_id: personId,
      }),
    })

    return res.status(200).json({ success: true, deal_id: dealId })

  } catch (error) {
    console.error('Erro PipeDrive:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
