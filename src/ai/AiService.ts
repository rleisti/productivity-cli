import AnthropicAiModel from "./AnthropicAiModel";
import Config from "../Config";

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
  return new AnthropicAiModel({
    apiKey: config.anthropic?.apiKey ?? "",
    model: config.anthropic?.model ?? "",
  });
}
