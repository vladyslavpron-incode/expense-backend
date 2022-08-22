import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'default-categories' })
export class DefaultCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  label!: string;
}
