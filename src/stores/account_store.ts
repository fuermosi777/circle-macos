import { Map } from 'immutable';
import { flow, observable, reaction } from 'mobx';

import db from '../database';
import { IAccount } from '../interface/account';
import { TransactionType } from '../interface/transaction';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';
import { RootStore } from './root_store';

export class AccountStore {
  @observable
  data: IAccount[] = [];

  @observable.ref
  runningBalance: Map<number, Dinero.Dinero> = Map();

  constructor(public rootStore: RootStore) {
    this.sync();

    reaction(
      () => this.data.map((account) => account.balance),
      () => {
        this.updateRuningBalance();
      },
    );
  }

  sync = flow(function*(this: AccountStore) {
    try {
      this.data = yield db.accounts.orderBy('name').toArray();
    } catch (err) {
      logger.error(err);
    }
  });

  updateRuningBalance = flow(function*(this: AccountStore) {
    try {
      let balanceMap: Map<number, Dinero.Dinero> = Map();
      const transactions = yield db.transactions.toArray();
      for (const account of this.data) {
        let rb = account.balance;
        for (const transaction of transactions) {
          if (transaction.accountId !== account.id) {
            continue;
          }
          if (account.isCredit) {
            if (transaction.type === TransactionType.Credit) {
              rb += transaction.amount;
            } else if (transaction.type === TransactionType.Debit) {
              rb -= transaction.amount;
            }
          } else {
            if (transaction.type === TransactionType.Credit) {
              rb -= transaction.amount;
            } else if (transaction.type === TransactionType.Debit) {
              rb += transaction.amount;
            }
          }
        }
        balanceMap = balanceMap.set(account.id, toDinero(rb, account.currency));
      }
      this.runningBalance = balanceMap;
    } catch (err) {
      throw err;
    }
  });

  delete = flow(function*(this: AccountStore, id: number) {
    try {
      yield db.accounts.delete(id);
      yield this.sync();
    } catch (err) {
      throw err;
    }
  });

  put = flow(function*(account: IAccount) {
    try {
      yield db.accounts.put(account);
      yield this.sync();
    } catch (err) {
      throw err;
    }
  });
}
