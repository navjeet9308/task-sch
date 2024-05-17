import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, IsString, IsDate, IsEnum, IsInt, Min } from 'class-validator';

enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number; // Use definite assignment assertion

  @Column()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Column()
  @IsNotEmpty()
  @IsDate()
  startDate!: Date;

  @Column()
  @IsNotEmpty()
  @IsDate()
  endDate!: Date;

  @Column()
  @IsNotEmpty()
  @IsEnum(Frequency)
  frequency!: Frequency;

  @Column()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  limit!: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  time!: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  locale!: string;
}
