import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'lectures' })
export class Lecture {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: true, length: 255 })
    content: string;

    @Column({ type: 'varchar', nullable: true, length: 255 })
    transcript: string;

    @Column({ type: 'varchar', nullable: true, length: 255 })
    summary: string;

    @Column({ type: 'varchar', name: 'flash_card', nullable: true, length: 500 })
    flashCard: string;

    @Column({ type: 'varchar', nullable: true, length: 255 })
    quiz: string;
}
