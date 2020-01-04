import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Currency } from '../interface/currency';
import { Account } from './account';
import { Category } from './category';

@Entity()
export class Payee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany((type) => Category)
  @JoinTable()
  categories: Category[];

  @ManyToMany((type) => Account)
  @JoinTable()
  accounts: Account[];
}
