export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    console.log('body 타입:', typeof req.body);
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      console.log('imageBase64 없음!');
      return res.status(400).json({ error: 'imageBase64 필요' });
    }
    console.log('imageBase64 길이:', imageBase64.length);

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
              text: '이 사진 왼쪽 하단의 표에서 정보를 읽어서 JSON으로만 반환하세요. 다른 설명 없이 JSON만 반환하세요.\n\n- addr: 소재지에서 동/리 이름만 (예: "성안동"). 시/구 제외\n- jibun: 지번 (예: "산72", "153")\n- name: 지장물명 (예: "석축", "그물망")\n\n{"addr":"","jibun":"","name":""}'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log('Claude 응답:', JSON.stringify(data).slice(0, 300));
    const text = data.content?.[0]?.text || '{}';
    console.log('텍스트:', text);
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    console.log('결과:', JSON.stringify(result));
    res.status(200).json(result);
  } catch (err) {
    console.log('에러:', err.message);
    res.status(500).json({ error: err.message });
  }
}
