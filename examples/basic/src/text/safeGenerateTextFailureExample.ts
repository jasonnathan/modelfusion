import { createOpenAITextModel } from "ai-utils.js/provider/openai";
import { generateText } from "ai-utils.js/text";

(async () => {
  const model = createOpenAITextModel({
    apiKey: "invalid-api-key",
    model: "text-davinci-003",
  });

  const generateStory = generateText.asSafeFunction({
    model,
    prompt: async ({ character }: { character: string }) =>
      `Write a short story about ${character} learning to love:\n\n`,
  });

  const result = await generateStory({ character: "a robot" });

  if (!result.ok) {
    console.error(result.error);
    return;
  }

  console.log(result.output);
})();