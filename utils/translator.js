import OpenAI from 'openai'

// Lấy API key từ environment variables (đã được load ở main.js)
const getApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Thiếu OPENAI_API_KEY. Vui lòng tạo file .env với OPENAI_API_KEY=your_key')
  }
  return apiKey
}

let client

const getClient = () => {
  if (!client) {
    const apiKey = getApiKey()
    client = new OpenAI({ apiKey })
  }
  return client
}

const buildResponseFormat = () => ({
  type: 'json_schema',
  json_schema: {
    name: 'translation_result',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        detectedLanguage: { type: 'string' },
        targetLanguage: { type: 'string' },
        translatedText: { type: 'string' }
      },
      required: ['detectedLanguage', 'targetLanguage', 'translatedText']
    }
  }
})

const translateText = async ({ text, model, targetLanguage, translationMode = 'meaning' }) => {
  const trimmed = text?.toString().trim()
  if (!trimmed) throw new Error('Nội dung trống')
  const selectedModel = model || 'gpt-4.1-nano'
  const preferredTarget = targetLanguage || 'Vietnamese'
  const mode = translationMode || 'meaning'
  
  let systemPrompt = 'Bạn là công cụ dịch thuật chính xác, tự động nhận diện ngôn ngữ đầu vào và dịch sang ngôn ngữ đích. Nếu ngôn ngữ đầu vào trùng với ngôn ngữ đích, hãy dịch sang ngôn ngữ khác phổ biến nhất đối với người dùng Việt Nam.'
  
  let userPrompt = `Ngôn ngữ ưu tiên: ${preferredTarget}\nVăn bản: """${trimmed}"""`
  
  if (mode === 'detailed') {
    systemPrompt += ' Khi dịch ở chế độ chi tiết, bạn PHẢI cung cấp giải thích đầy đủ. Trong phần translatedText, hãy trả về theo format sau:\n\n[Bản dịch]\n\n[Giải thích ngữ pháp]\n- Cấu trúc câu: ...\n- Ngữ pháp: ...\n\n[Cụm từ quan trọng]\n- [cụm từ 1]: giải thích\n- [cụm từ 2]: giải thích\n\n[Ghi chú sử dụng]\n- ...'
    userPrompt += '\n\nQUAN TRỌNG: Hãy dịch và cung cấp giải thích chi tiết về:\n1. Bản dịch chính xác\n2. Giải thích ngữ pháp và cấu trúc câu\n3. Giải thích các cụm từ, từ vựng quan trọng\n4. Ghi chú về cách sử dụng và ngữ cảnh\n\nĐảm bảo phần translatedText bao gồm TẤT CẢ các phần trên với format rõ ràng.'
  } else {
    systemPrompt += ' Chỉ dịch nghĩa một cách chính xác và tự nhiên, không cần giải thích thêm.'
  }
  
  systemPrompt += ' Trả về kết quả dưới dạng JSON với format: {"detectedLanguage": "...", "targetLanguage": "...", "translatedText": "..."}'
  
  const maxTokens = mode === 'detailed' ? 2000 : 500
  
  const completion = await getClient().chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    response_format: buildResponseFormat(),
    temperature: mode === 'detailed' ? 0.3 : 0.2,
    max_tokens: maxTokens
  })
  const output = completion.choices?.[0]?.message?.content
  if (!output) throw new Error('Không nhận được phản hồi')
  let parsed
  try {
    parsed = JSON.parse(output)
  } catch (error) {
    throw new Error('Không thể hiểu phản hồi')
  }
  if (!parsed?.translatedText) throw new Error('Phản hồi không hợp lệ')
  return {
    originalText: trimmed,
    translatedText: parsed.translatedText,
    detectedLanguage: parsed.detectedLanguage,
    targetLanguage: parsed.targetLanguage,
    model: selectedModel
  }
}

export { translateText }

