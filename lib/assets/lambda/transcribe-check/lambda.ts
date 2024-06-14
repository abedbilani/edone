import { headObjectFromBucket } from '../../shared/services/aws/s3.service';
import { ERROR_TYPES } from '../../helpers/api-response.enum';
import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { LectureStepStatus } from '../../shared/services/database/entities/lecture-step-status';
import { LECTURE_STEPS, STATUS } from '../../shared/services/database/enums/lecture-process-status.enum';

exports.handler = async (event: any): Promise<any> => {
    try {
        console.log('lib->assets->lambda->transcribe->check->lambda->ts, line: 6 => ', event);
        const {
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
        } = event;

        let status = 'in_progress';

        if (await headObjectFromBucket(outputBucket, sagemakerOutputLocation)) {
            status = 'complete';
        }
        if (await headObjectFromBucket(outputBucket, sagemakerFailureLocation)) {
            status = 'failed';
        }
        const dataSource: DataSource = await Database.getConnection();

        await dataSource
            .getRepository(LectureStepStatus)
            .createQueryBuilder()
            .update(LectureStepStatus)
            .set({ status: STATUS.IN_PROGRESS })
            .where('lecture_id = :lectureId AND step = :step ', { lectureId, step: LECTURE_STEPS.TRANSCRIPT })
            .execute();

        return {
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            outputBucket,
            inputBucket,
            federatedIdentity,
            lectureId,
            status,
        };
    } catch (e) {
        console.error('lib->assets->lambda->transcribe->check->lambda->ts, line: 35 => ', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};
