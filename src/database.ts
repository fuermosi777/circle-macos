import Dexie from 'dexie';

import { IAccount } from './interface/account';
import { ICategory } from './interface/category';
import { IPayee } from './interface/payee';
import { ITransaction } from './interface/transaction';

class MainDatabase extends Dexie {
  accounts: Dexie.Table<IAccount, number>;
  categories: Dexie.Table<ICategory, number>;
  payees: Dexie.Table<IPayee, number>;
  transactions: Dexie.Table<ITransaction, number>;

  constructor() {
    super('MainDatabase');
    this.version(1).stores({
      accounts: '++id, name, currency, balance, isCredit',
      categories: '++id, name, type',
      payees: '++id, name, categoryIds, accountIds',
      transactions:
        '++id, type, amount, accountId, date, payeeId, categoryId, from, to, siblingId, status, isDone, note',
    });

    this.accounts = this.table('accounts');
    this.categories = this.table('categories');
    this.payees = this.table('payees');
    this.transactions = this.table('transactions');
  }
}

const db = new MainDatabase();

export default db;
