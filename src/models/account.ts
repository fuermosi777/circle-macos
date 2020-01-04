import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Currency } from '../interface/currency';
import { Transaction } from './transaction';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  currency: Currency;

  @Column()
  balance: number;

  @Column()
  isCredit: boolean;

  @OneToMany(
    (type) => Transaction,
    (transaction) => transaction.account,
  )
  transactions: Transaction[];
}
