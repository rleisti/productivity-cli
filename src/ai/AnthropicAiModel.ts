import Anthropic from "@anthropic-ai/sdk";
import { AiService, AiServiceMessage } from "./AiService";
import { Model } from "@anthropic-ai/sdk/resources/messages/messages";

export type AnthropicAiModelConfiguration = {
  model: Model;
  apiKey: string;
};

/**
 * An AI model implementation for Anthropic
 */
export default class AnthropicAiModel implements AiService {
  private readonly aiService: Anthropic;
  private readonly model: Model;

  constructor(config: AnthropicAiModelConfiguration) {
    this.aiService = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model as Model;
  }

  async converse(messages: AiServiceMessage[]): Promise<AiServiceMessage> {
    const response = await this.aiService.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: messages.map((message) => ({
        content: message.content,
        role: message.role === "user" ? "user" : "assistant",
      })),
    });

    return {
      content: response.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n"),
      role: "model",
    };
  }
}
