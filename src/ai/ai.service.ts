import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

export type ChatHistoryItem = { role: 'user' | 'model'; text: string };

@Injectable()
export class AiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(message: string, history: ChatHistoryItem[] = []): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'Bạn là nhân viên bán hàng của ShopAI. Chỉ tư vấn về đồ công nghệ. Trả lời cực ngắn dưới 30 chữ. Không nói chuyện chính trị.',
    });

    // Đổi { role, text } từ Mobile thành định dạng Gemini Content[]
    const geminiHistory: Content[] = history.slice(-10).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }
}
