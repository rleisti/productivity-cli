import { AiService, AiServiceMessage } from "./AiService";

export default class FakeAiService implements AiService {
  async converse(messages: AiServiceMessage[]): Promise<AiServiceMessage> {
    return {
      content:
        `I see ${messages.length} messages.\n` +
        messages
          .map(
            (message) =>
              `**ROLE**:\n${message.role}:\n\n` +
              `**MESSAGE**:\n${message.content}`,
          )
          .join("\n"),
      role: "model",
    };
  }
}
