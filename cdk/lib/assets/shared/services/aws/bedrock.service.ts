import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { InvokeBedrockModel } from './types/bedrock.type';

export const bedrockInvokeModel = async (params: InvokeBedrockModel): Promise<string> => {
    const bedrockRuntimeClient: BedrockRuntimeClient = new BedrockRuntimeClient();
    const payload = {
        anthropic_version: params.anthropicVersion,
        max_tokens: params.maxTokens,
        messages: [
            {
                role: 'user',
                content: params.prompt,
            },
        ],
    };
    const apiResponse = await bedrockRuntimeClient.send(
        new InvokeModelCommand({
            contentType: 'application/json',
            body: JSON.stringify(payload),
            modelId: params.modelId,
        }),
    );

    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);

    const responseBody = JSON.parse(decodedResponseBody);
    return responseBody.content[0].text;
};

export const generateQuizPrompt = {
    MCQ: (transcriptionText: string, numberOfQuestions: number = 3) => `
            <document>
            ${transcriptionText}
            </document>
            
            <instructions>
             Create a Q & A quiz based on the given summary.
             Generate ${numberOfQuestions} questions, each with 4 options, where only one option is correct.
             Ensure the questions cover a range of topics from the summary.
             Enclose the generated questions in <quiz></quiz> tags
             Make sure to use " instead of ', in order to load the answer as json
             Make sure the output is a properly formatted json list
             Provide each question in the following format:
             [
                {
                    "id":"a",
                    "question": "<generated_question>",
                    "choices":
                    [
                        {
                            "id":"a",
                            "choice":"<choice1>"
                        },
                        {
                            "id":"b",
                            "choice":"<choice2>"
                        },
                        {
                            "id":"c",
                            "choice":"<choice3>"
                        },
                        {
                            "id":"d",
                            "choice":"<choice4>"
                        },
                    ],
                    "answer": "<correct_choice>"
                },
                {
                    "id":"b",
                    "question": "<generated_question>",
                    "choices":
                    [
                        {
                            "id":"a",
                            "choice":"<choice1>"
                        },
                        {
                            "id":"b",
                            "choice":"<choice2>"
                        },
                        {
                            "id":"c",
                            "choice":"<choice3>"
                        },
                        {
                            "id":"d",
                            "choice":"<choice4>"
                        },
                    ],
                    "answer": "<correct_choice>"
                },
                ...
            ]
            </instructions>`,
    MCQ_MS: (transcriptionText: string, numberOfQuestions: number = 3) => `
        <document>
                ${transcriptionText}
                </document>
                
                <instructions>
                  Create a multi select multiple choice quiz based on the given summary. 
                  Generate ${numberOfQuestions} questions, each with 4 options.
                  Each question has between 2-4 correct answers.
                  Ensure the questions cover a range of topics from the summary.
                  Provide the quiz in between <quiz></quiz> tags
                  Make sure to use " instead of ', in order to load the answer as json
                  Provide each question in the following format:
                  [
                  {
                    "id":"a",
                    "question": "<generated_question>",
                    "choices":
                    [
                    {
                    "id":"a",
                    "choice":"<choice1>"
                    },
                    {
                    "id":"b",
                    "choice":"<choice2>"
                    },
                    {
                    "id":"c",
                    "choice":"<choice3>"
                    },
                    {
                    "id":"d",
                    "choice":"<choice4>"
                    },
                    ],
                    "answers": 
                    [
                    "<first_correct_choice>",
                    "<second_correct_choice>"
                    ]
                  },
                  {
                    "id":"b",
                    "question": "<generated_question>",
                    "choices":
                    [
                    {
                    "id":"a",
                    "choice":"<choice1>"
                    },
                    {
                    "id":"b",
                    "choice":"<choice2>"
                    },
                    {
                    "id":"c",
                    "choice":"<choice3>"
                    },
                    {
                    "id":"d",
                    "choice":"<choice4>"
                    },
                    ],
                    "answers": 
                    [
                    "<first_correct_choice>", 
                    "<second_correct_choice>"
                    ]
                  },
                  {
                    "id":"c",
                    "question": "<generated_question>",
                    "choices":
                    [
                    {
                    "id":"a",
                    "choice":"<choice1>"
                    },
                    {
                    "id":"b",
                    "choice":"<choice2>"
                    },
                    {
                    "id":"c",
                    "choice":"<choice3>"
                    },
                    {
                    "id":"d",
                    "choice":"<choice4>"
                    },
                    ],
                    "answers": 
                    [
                    "<first_correct_choice>", 
                    "<second_correct_choice>"
                    ]
                  },
                  ...
                  ]
                </instructions>
    
    `,
    TRUE_FALSE: (transcriptionText: string, numberOfQuestions: number = 3) => `
    
                            
                <document>
                ${transcriptionText}
                </document>
                
                <instructions>
                  Create a True or False quiz based on the given summary. 
                  Generate ${numberOfQuestions} questions and provide the answer to those questions. 
                  Ensure the questions cover a range of topics from the summary.
                  Provide the quiz in between <quiz></quiz> tags
                  Make sure to use " instead of ', in order to load the answer as json
                  Provide each question in the following format:
                  [
                  {
                    "id":"a",
                    "question": "<generated_question>",
                    "answer": "<True | False>"
                  },
                  {
                    "id":"b",
                    "question": "<generated_question>",
                    "answer": "<True | False>"
                  },
                  {
                    "id":"c",
                    "question": "<generated_question>",
                    "answer": "<True | False>"
                  },
                  {
                    "id":"d",
                    "question": "<generated_question>",
                    "answer": "<True | False>"
                  },
                  {
                    "id":"e",
                    "question": "<generated_question>",
                    "answer": "<True | False>"
                  },
                  ...
                  ]
                </instructions>
    
    `,
    FILL_IN_BLANK: (transcriptionText: string, numberOfQuestions: number = 3) => `
            <document>
                ${transcriptionText}
            </document>
            
            <instructions>
              Create a Fill in the blanks quiz based on the given summary. 
              Generate ${numberOfQuestions} questions and provide the answer to those questions.
              Make sure the answers are clear, concise, and direct.
              Add the word {{BLANK}} in place of the missing word in the answer.
              An example is provided in <example></example> tags.
              Ensure the questions cover a range of topics from the summary. 
              Enclose the generated questions in <quiz></quiz> tags
              Make sure to use " instead of ', in order to load the answer as json
              Provide each question in the following format:

              [
              {
                "id": "1",
                "question": "<generated_question>",
                "answer": "<sentence_w_missing_word>",
                "missing": "<missing_word>"
               },
              {
                "id": "2",
                "question": "<generated_question>",
                "answer": "<sentence_w_missing_word>",
                "missing": "<missing_word>"
              },
              {
                "id": "3",
                  "question": "<generated_question>",
                "answer": "<sentence_w_missing_word>",
                "missing": "<missing_word>"
              },
              {
                "id": "4",
                  "question": "<generated_question>",
                "answer": "<sentence_w_missing_word>",
                "missing": "<missing_word>"
              },
              {
                "id": "5",
                  "question": "<generated_question>",
                "answer": "<sentence_w_missing_word>",
                "missing": "<missing_word>"
              },
              ...
              ]
            </instructions>
            
            <example>
                {
                  "id": "6",
                  "question": "How should the output of logistic regression be interpreted in a binary classification problem?",
                  "answer": "The output of logistic regression should be interpreted as the {{BLANK}} that the class or label y will be equal to 1, given a certain input x.",
                  "missing": "probability"
                }
            </example>
`,
};

export const generateSummaryPrompt = (transcriptionText: string): string => {
    return `
    <document>
    ${transcriptionText}
    </document>

    <instructions>
      Using points, provide a summary of the provided text inside the <document></document> tags.
      Do not use any symbols for the points.
      Focus on the course's objectives, key topics, and learning outcomes, ensuring the summary is concise and captures the essence of the course for promotional materials.
      Provide the summary points in the following format: <p></p><p></p><p></p><p></p><p></p>...
    </instructions>`;
};

export const generateFlashCardsPrompt = (transcriptionText: string, numQuestions = 3): string => {
    return `
        <document>
            ${transcriptionText}
        </document>
        <instructions>
            Create flashcards questions and answers based on the given summary.
            Generate ${numQuestions} questions and answers.
            Ensure the questions cover a range of topics from the summary.
            Enclose the generated questions in <quiz></quiz> tags.
            Make sure to use double quotes (") instead of single quotes (') to load the answer as JSON.
            Provide each question in the following format:
        
            [
                {
                    "id": "1",
                    "question": "<generated_question>",
                    "answer": "<answer>"
                },
                {
                    "id": "2",
                    "question": "<generated_question>",
                    "answer": "<answer>"
                },
                {
                    "id": "3",
                    "question": "<generated_question>",
                    "answer": "<answer>"
                },
                {
                    "id": "4",
                    "question": "<generated_question>",
                    "answer": "<answer>"
                },
                ...
            ]
        </instructions>`;
};
