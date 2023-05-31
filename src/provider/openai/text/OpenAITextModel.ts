import { GenerateModel } from "../../../text/generate/GenerateModel.js";
import { TokenizerModel } from "../../../text/tokenize/TokenizerModel.js";
import { getTiktokenTokenizerForModel } from "../tokenizer/tiktoken.js";
import { OpenAITextCompletion } from "./OpenAITextCompletion.js";
import { generateOpenAITextCompletion } from "./generateOpenAITextCompletion.js";

// see https://platform.openai.com/docs/models/
export const OPENAI_TEXT_MODELS = {
  "text-davinci-003": {
    maxTokens: 4096,
  },
  "text-davinci-002": {
    maxTokens: 4096,
  },
  "code-davinci-002": {
    maxTokens: 8000,
  },
  "text-curie-001": {
    maxTokens: 2048,
  },
  "text-babbage-001": {
    maxTokens: 2048,
  },
  "text-ada-001": {
    maxTokens: 2048,
  },
  davinci: {
    maxTokens: 2048,
  },
  curie: {
    maxTokens: 2048,
  },
  babbage: {
    maxTokens: 2048,
  },
  ada: {
    maxTokens: 2048,
  },
};

export type OpenAITextModelType = keyof typeof OPENAI_TEXT_MODELS;

export type OpenAITextModelSettings = {
  isUserIdForwardingEnabled?: boolean;

  suffix?: string;
  maxCompletionTokens?: number;
  temperature?: number;
  topP?: number;
  n?: number;
  logprobs?: number;
  echo?: boolean;
  stop?: string | string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  bestOf?: number;
};

export type OpenAITextModel = GenerateModel<
  string,
  OpenAITextCompletion,
  string
> &
  TokenizerModel<number[]> & {
    /**
     * Maximum number of prompt and completion tokens that this model supports.
     */
    readonly maxTokens: number;

    readonly countPromptTokens: (prompt: string) => PromiseLike<number>;

    readonly withSettings: (
      settings: OpenAITextModelSettings
    ) => OpenAITextModel;
  };

/**
 * Create a text generation model that calls the OpenAI text completion API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions/create
 *
 * @example
 * const textModel = createOpenAITextModel({
 *   apiKey: OPENAI_API_KEY,
 *   model: "text-davinci-003",
 *   settings: { temperature: 0.7 },
 * });
 *
 * const response = await textModel
 *   .withSettings({ maxCompletionTokens: 500 })
 *   .generate("Write a short story about a robot learning to love:\n\n");
 *
 * const text = await textModel.extractOutput(response);
 */
export const createOpenAITextModel = ({
  baseUrl,
  apiKey,
  model,
  settings = {},
}: {
  baseUrl?: string;
  apiKey: string;
  model: OpenAITextModelType;
  settings?: OpenAITextModelSettings;
}): OpenAITextModel => {
  const tokenizer = getTiktokenTokenizerForModel({ model });

  return {
    vendor: "openai",
    model,

    tokenizer,
    maxTokens: OPENAI_TEXT_MODELS[model].maxTokens,
    countPromptTokens: (prompt: string) => tokenizer.countTokens(prompt),

    generate: async (input: string, context): Promise<OpenAITextCompletion> =>
      generateOpenAITextCompletion({
        baseUrl,
        abortSignal: context?.abortSignal,
        apiKey,
        prompt: input,
        model,
        user: settings.isUserIdForwardingEnabled ? context?.userId : undefined,
        ...settings,
      }),

    extractOutput: async (rawOutput: OpenAITextCompletion): Promise<string> => {
      return rawOutput.choices[0]!.text;
    },

    withSettings: (additionalSettings: OpenAITextModelSettings) =>
      createOpenAITextModel({
        baseUrl,
        apiKey,
        model,
        settings: Object.assign({}, settings, additionalSettings),
      }),
  };
};