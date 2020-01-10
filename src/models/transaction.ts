import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Account } from './account';
import { Category } from './category';
import { Payee } from './payee';

export enum TransactionType {
  Credit,
  Debit,
  // This is only used in the selections. No transaction should actually use this type.
  Transfer,
}

export enum TransactionStatus {
  Pending,
  Cleared,
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  type: TransactionType;

  @Column()
  amount: number;

  @Column({ nullable: true })
  accountId: number;

  @ManyToOne(
    (type) => Account,
    (account) => account.transactions,
  )
  @JoinColumn()
  account: Account;

  @Column()
  date: Date;

  @ManyToOne((type) => Payee)
  @JoinColumn()
  payee?: Payee;

  @ManyToOne((type) => Category)
  @JoinColumn()
  category?: Category;

  @ManyToOne((type) => Account)
  @JoinColumn()
  from?: Account;

  @ManyToOne((type) => Account)
  @JoinColumn()
  to?: Account;

  @OneToOne((type) => Transaction)
  @JoinColumn()
  sibling?: Transaction;

  @Column({ type: 'integer' })
  status: TransactionStatus;

  @Column()
  isDone: boolean;

  @Column()
  note: string;
}
