import { getObjectFromBucket, putObjectInBucket } from '../../shared/services/aws/s3.service';
import { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { bedrockInvokeModel, generateFlashCardsPrompt } from '../../shared/services/aws/bedrock.service';
import { InvokeBedrockModel } from '../../shared/services/aws/types/bedrock.type';
import { generateId } from '../../helpers/ulid';
import { ERROR_TYPES } from '../../helpers/api-response.enum';
import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { Lecture } from '../../shared/services/database/entities/lecture';
import { formatResponseQuiz } from '../../helpers/format.helper';
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
            prompt: generateFlashCardsPrompt(lectureContent),
        };
        const invokeBedrock: string = await bedrockInvokeModel(bedrockParams);
        console.log('lib->assets->lambda->flash->card->lambda->ts, line: 33 => ', bedrockParams);

        const flashCardKey = `${event.federatedIdentity}/${Number(lectureId)}/${generateId()}_flash_cards.txt`;
        const lectureFlashCard: PutObjectCommandOutput = await putObjectInBucket(
            outputBucket,
            flashCardKey,
            formatResponseQuiz(invokeBedrock),
        );

        const dataSource: DataSource = await Database.getConnection();
        await dataSource
            .getRepository(Lecture)
            .createQueryBuilder()
            .update(Lecture)
            .set({ flashCard: flashCardKey })
            .where('id = :lectureId', { lectureId: Number(lectureId) })
            .execute();

        await dataSource
            .getRepository(LectureStepStatus)
            .createQueryBuilder()
            .update(LectureStepStatus)
            .set({ status: STATUS.COMPLETED })
            .where('lecture_id = :lectureId AND step = :step', {
                lectureId: Number(lectureId),
                step: LECTURE_STEPS.FLASHCARD,
            })
            .execute();

        return {
            contentFileKey,
            flashCardKey,
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
        };
    } catch (e) {
        console.error('lib->assets->lambda->flash->card->lambda->ts, line: 37 => ', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};
