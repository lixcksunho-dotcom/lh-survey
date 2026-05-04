export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  try {
    const { imageBase64, mimeType } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 }
            },
            {
              type: 'text',
              text: `이 현장사진의 표에서 소재지, 지번, 지장물 정보를 찾아서 JSON으로만 반환하세요. 다른 설명 없이 JSON만 반환하세요.
표가 없거나 정보를 찾을 수 없으면 빈 문자열로 반환하세요.
{
  "addr": "소재지 (예: 성안동)",
  "jibun": "지번 (예: 153)",
  "name": "지장물명 (예: 그물망, 건물, 전신주 등)"
}`
            }
          ]
        }]
      })
    });
 
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
