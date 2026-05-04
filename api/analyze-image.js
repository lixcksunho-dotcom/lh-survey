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
              text: `이 사진 왼쪽 하단의 표에서 정보를 읽어서 JSON으로만 반환하세요. 다른 설명 없이 JSON만 반환하세요.

- addr: 소재지에서 동/리 이름만 (예: "성안동", "복산동"). 시/구 제외
- jibun: 지번 숫자만 (예: "산72", "153", "75-1")
- name: 지장물명만 (예: "석축", "그물망", "건물")

표가 없으면 빈 문자열로 반환하세요.

{"addr":"","jibun":"","name":""}`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    console.log('Claude 응답 텍스트:', text);
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    console.log('파싱 결과:', JSON.stringify(result));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
