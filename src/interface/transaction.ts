import { IAccount } from './account';
import { ICategory } from './category';
import { IPayee } from './payee';

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

export interface ITransaction {
  id?: number;
  type: TransactionType;
  amount: number;
  accountId: number;
  date: Date;

  // Could be null in transfers.
  payeeId?: number;
  categoryId?: number;
  // For transfer only.
  from?: number;
  to?: number;
  // For transfers a transaction will have a corresponding one.
  siblingId?: number;

  status: TransactionStatus;
  // In Bank or account Reconciliation mark as done means no need to look into them this transaction again.
  isDone: boolean;
  note?: string;
}

export interface ITransactionInstance extends ITransaction {
  payee?: IPayee;
  category?: ICategory;
  account?: IAccount;
  fromAccount?: IAccount;
  toAccount?: IAccount;
}
