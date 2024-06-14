import { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { getObjectFromBucket, putObjectInBucket } from '../../shared/services/aws/s3.service';
import { bedrockInvokeModel, generateQuizPrompt } from '../../shared/services/aws/bedrock.service';
import { InvokeBedrockModel } from '../../shared/services/aws/types/bedrock.type';
import { generateId } from '../../helpers/ulid';
import { ERROR_TYPES } from '../../helpers/api-response.enum';
import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { Lecture } from '../../shared/services/database/entities/lecture';
import { formatResponseQuiz } from '../../helpers/format.helper';
import { LectureStepStatus } from '../../shared/services/database/entities/lecture-step-status';
import { LECTURE_STEPS, STATUS } from '../../shared/services/database/enums/lecture-process-status.enum';

exports.handler = async (event: any) => {
    try {
        const {
            contentFileKey,
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
            MCQNumber,
            MCQMSNumber,
            TrueFalseNumber,
            FillInBlankNumber,
        } = event;

        const lectureContent: string = await getObjectFromBucket(outputBucket, contentFileKey);
        const bedrockParamsMCQ: InvokeBedrockModel = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            anthropicVersion: 'bedrock-2023-05-31',
            maxTokens: 4096,
            prompt: generateQuizPrompt.MCQ(lectureContent, MCQNumber),
        };

        const bedrockParamsMCQMS: InvokeBedrockModel = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            anthropicVersion: 'bedrock-2023-05-31',
            maxTokens: 4096,
            prompt: generateQuizPrompt.MCQ_MS(lectureContent, MCQMSNumber),
        };

        const bedrockParamsTrueFalse: InvokeBedrockModel = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            anthropicVersion: 'bedrock-2023-05-31',
            maxTokens: 4096,
            prompt: generateQuizPrompt.TRUE_FALSE(lectureContent, TrueFalseNumber),
        };

        const bedrockParamsFillInBlank: InvokeBedrockModel = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            anthropicVersion: 'bedrock-2023-05-31',
            maxTokens: 4096,
            prompt: generateQuizPrompt.FILL_IN_BLANK(lectureContent, FillInBlankNumber),
        };

        const invokeBedrockMCQ: string = await bedrockInvokeModel(bedrockParamsMCQ);
        console.log('lib->assets->lambda->quiz->lambda->ts, line: 59 => ', invokeBedrockMCQ);
        const invokeBedrockMCQMS: string = await bedrockInvokeModel(bedrockParamsMCQMS);
        console.log('lib->assets->lambda->quiz->lambda->ts, line: 61 => ', invokeBedrockMCQMS);
        const invokeBedrockTrueFalse: string = await bedrockInvokeModel(bedrockParamsTrueFalse);
        console.log('lib->assets->lambda->quiz->lambda->ts, line: 63 => ', invokeBedrockTrueFalse);
        const invokeBedrockFillInBlank: string = await bedrockInvokeModel(bedrockParamsFillInBlank);
        console.log('lib->assets->lambda->quiz->lambda->ts, line: 65 => ', invokeBedrockFillInBlank);

        const quizObject = {
            MCQ: JSON.parse(formatResponseQuiz(invokeBedrockMCQ)),
            MCQMS: JSON.parse(formatResponseQuiz(invokeBedrockMCQMS)),
            TrueFalse: JSON.parse(formatResponseQuiz(invokeBedrockTrueFalse)),
            FillInBlank: JSON.parse(formatResponseQuiz(invokeBedrockFillInBlank)),
        };

        const quizKey = `${event.federatedIdentity}/${Number(lectureId)}/${generateId()}_quiz.txt`;

        const lectureQuiz: PutObjectCommandOutput = await putObjectInBucket(
            outputBucket,
            quizKey,
            JSON.stringify(quizObject),
        );
        const dataSource: DataSource = await Database.getConnection();
        await dataSource
            .getRepository(Lecture)
            .createQueryBuilder()
            .update(Lecture)
            .set({ quiz: quizKey })
            .where('id = :lectureId', { lectureId: Number(lectureId) })
            .execute();

        await dataSource
            .getRepository(LectureStepStatus)
            .createQueryBuilder()
            .update(LectureStepStatus)
            .set({ status: STATUS.COMPLETED })
            .where('lecture_id = :lectureId AND step = :step', {
                lectureId: Number(lectureId),
                step: LECTURE_STEPS.QUIZ,
            })
            .execute();

        return {
            contentFileKey,
            quizKey,
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
        };
    } catch (e) {
        console.error('lib->assets->lambda->quiz->lambda->ts, line: 51 => ', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};
