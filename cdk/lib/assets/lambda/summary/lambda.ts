import { bedrockInvokeModel, generateSummaryPrompt } from '../../shared/services/aws/bedrock.service';
import { InvokeBedrockModel } from '../../shared/services/aws/types/bedrock.type';
import { getObjectFromBucket, putObjectInBucket } from '../../shared/services/aws/s3.service';
import { generateId } from '../../helpers/ulid';
import { ERROR_TYPES } from '../../helpers/api-response.enum';
import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { Lecture } from '../../shared/services/database/entities/lecture';
import { LectureStepStatus } from '../../shared/services/database/entities/lecture-step-status';
import { LECTURE_STEPS, STATUS } from '../../shared/services/database/enums/lecture-process-status.enum';

exports.handler = async (event: any): Promise<any> => {
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
        } = event;

        const lectureContent: string = await getObjectFromBucket(outputBucket, contentFileKey);
        const bedrockParams: InvokeBedrockModel = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            anthropicVersion: 'bedrock-2023-05-31',
            maxTokens: 4096,
            prompt: generateSummaryPrompt(lectureContent),
        };
        console.log('lib->assets->lambda->summary->lambda->ts, line: 31 => ', bedrockParams);
        const invokeBedrock: string = await bedrockInvokeModel(bedrockParams);
        console.log('lib->assets->lambda->summary->lambda->ts, line: 31 => ', invokeBedrock);
        const summaryKey = `${event.federatedIdentity}/${Number(lectureId)}/${generateId()}_summary.txt`;

        await putObjectInBucket(outputBucket, summaryKey, JSON.stringify({ summary: invokeBedrock, verify: false }));

        const dataSource: DataSource = await Database.getConnection();
        await dataSource
            .getRepository(Lecture)
            .createQueryBuilder()
            .update(Lecture)
            .set({ summary: summaryKey })
            .where('id = :lectureId', { lectureId: Number(lectureId) })
            .execute();

        await dataSource
            .getRepository(LectureStepStatus)
            .createQueryBuilder()
            .update(LectureStepStatus)
            .set({ status: STATUS.COMPLETED })
            .where('lecture_id = :lectureId AND step = :step', {
                lectureId: Number(lectureId),
                step: LECTURE_STEPS.SUMMARY,
            })
            .execute();

        return {
            contentFileKey,
            summaryKey,
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
        };
    } catch (e) {
        console.error('lib->assets->lambda->summary->lambda->ts, line: 46 => ', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};
