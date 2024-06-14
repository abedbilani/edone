import { DataSource } from 'typeorm';
import { Database } from '../../shared/services/database/database';
import { LectureStepStatus } from '../../shared/services/database/entities/lecture-step-status';
import { STATUS } from '../../shared/services/database/enums/lecture-process-status.enum';

exports.handler = async (event: any): Promise<any> => {
    try {
        const dataSource: DataSource = await Database.getConnection();

        await dataSource
            .getRepository(LectureStepStatus)
            .createQueryBuilder()
            .update(LectureStepStatus)
            .set({ status: STATUS.FAILED })
            .where('lecture_id = :lectureId', { lectureId: event.lectureId })
            .execute();

        return event;
    } catch (e) {
        console.log('lib->assets->lambda->transcribe->failed->lambda->ts, line: 7 => ', e);
    }
};
