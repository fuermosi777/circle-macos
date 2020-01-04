import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum CategoryType {
  Expense,
  Income,
}

export interface IRawCategory {
  name: string;
  type: 'expense' | 'income';
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  type: CategoryType;

  @Column({ type: 'text', unique: true })
  name: string;
}
