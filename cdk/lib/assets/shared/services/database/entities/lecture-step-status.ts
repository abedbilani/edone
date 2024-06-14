import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'lecture_step_statuses' })
export class LectureStepStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'lecture_id' })
    lectureId: number;

    @Column({ type: 'varchar', length: 15 })
    step: string;

    @Column({ type: 'int', default: 0 })
    status: number;
}
