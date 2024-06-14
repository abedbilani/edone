import { getObjectFromBucket, putObjectInBucket } from '../../shared/services/aws/s3.service';
import { ERROR_TYPES } from '../../helpers/api-response.enum';
import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { Lecture } from '../../shared/services/database/entities/lecture';
import { LectureStepStatus } from '../../shared/services/database/entities/lecture-step-status';
import { LECTURE_STEPS, STATUS } from '../../shared/services/database/enums/lecture-process-status.enum';

exports.handler = async (event: any): Promise<any> => {
    try {
        const {
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
        } = event;

        const transcript: string = await getObjectFromBucket(outputBucket, sagemakerOutputLocation);
        console.log('lib->assets->lambda->transcribe->success->lambda->ts, line: 20 => ', transcript);
        const jsonObject = validateTranscript(transcript);

        if (validateTranscript(transcript) !== null) {
            const contentFileKey: string = `${federatedIdentity}/${lectureId}/${sagemakerOutputLocation}_content.txt`;
            const transcriptFileKey: string = `${federatedIdentity}/${lectureId}/${sagemakerOutputLocation}_transcript.txt`;

            await putObjectInBucket(outputBucket, transcriptFileKey, JSON.stringify(jsonObject));
            console.log('Successfully wrote transcript to S3 with key:', transcriptFileKey);

            const content: string = concatenateContent(jsonObject);
            console.log('Successfully wrote content to S3 with key:', content);
            await putObjectInBucket(outputBucket, contentFileKey, content);
            console.log('Successfully wrote content to S3 with key:', contentFileKey);

            const dataSource: DataSource = await Database.getConnection();
            await dataSource
                .getRepository(Lecture)
                .createQueryBuilder()
                .update(Lecture)
                .set({ content: contentFileKey, transcript: transcriptFileKey })
                .where('id = :lectureId', { lectureId })
                .execute();

            await dataSource
                .getRepository(LectureStepStatus)
                .createQueryBuilder()
                .update(LectureStepStatus)
                .set({ status: STATUS.IN_PROGRESS })
                .where('lecture_id = :lectureId', { lectureId })
                .execute();

            await dataSource
                .getRepository(LectureStepStatus)
                .createQueryBuilder()
                .update(LectureStepStatus)
                .set({ status: STATUS.COMPLETED })
                .where('lecture_id = :lectureId AND step = :step', { lectureId, step: LECTURE_STEPS.TRANSCRIPT })
                .execute();

            return {
                contentFileKey,
                sagemakerOutputLocation,
                sagemakerFailureLocation,
                outputBucket,
                inputBucket,
                federatedIdentity,
                lectureId: lectureId.toString(),
                status,
            };
        }
        return false;
    } catch (e) {
        console.log('lib->assets->lambda->transcribe->lambda->ts, line: 17 => ', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};

function validateTranscript(data: string): any {
    const jsonData = JSON.parse(data);
    return Array.isArray(jsonData) ? jsonData[0] : null;
}

function concatenateContent(data): string {
    let concatenatedContent: string = '';
    for (const segment of data) {
        const language = Object.keys(segment.translations)[0]; // Get the language code
        concatenatedContent += segment.translations[language].content;
    }
    return concatenatedContent;
}
