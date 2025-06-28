import AnthropicAiService from "./AnthropicAiService";
import Config from "../Config";
import FakeAiService from "./FakeAiService";

export interface AiService {
  converse(messages: AiServiceMessage[]): Promise<AiServiceMessage>;
}

export type AiServiceMessage = {
  content: string;
  role: "user" | "model";
};

/**
 * Load an AI service implementation based on the configuration
 *
 * @param config the configuration settings.
 */
export function getAiService(config: Config): AiService {
  const { aiService } = config;
  switch (aiService) {
    case "anthropic": {
      return new AnthropicAiService({
        apiKey: config.anthropic?.apiKey ?? "",
        model: config.anthropic?.model ?? "",
      });
    }
    default: {
      return new FakeAiService();
    }
  }
}
