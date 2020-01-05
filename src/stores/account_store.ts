import { Map } from 'immutable';
import { flow, observable, reaction } from 'mobx';
import { Not, getRepository as repo } from 'typeorm';

import { Account } from '../models/account';
import { TransactionType } from '../models/transaction';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';
import { RootStore } from './root_store';

type AccountInfo = Map<number, Dinero.Dinero>;

export class AccountStore {
  @observable
  data: Account[] = [];

  @observable
  totalCredit: AccountInfo = Map();

  @observable
  totalDebit: AccountInfo = Map();

  constructor(public rootStore: RootStore) {
    this.freshLoad();
  }

  freshLoad = flow(function*(this: AccountStore) {
    try {
      this.data = yield repo(Account).find({
        order: {
          name: 'ASC',
        },
        relations: ['transactions'],
      });
      const [totalCredit, totalDebit] = this.updateRuningBalance();
      this.totalCredit = totalCredit;
      this.totalDebit = totalDebit;
    } catch (err) {
      logger.error(err);
    }
  });

  private updateRuningBalance(): [AccountInfo, AccountInfo] {
    try {
      let totalCredit: AccountInfo = Map();
      let totalDebit: AccountInfo = Map();
      for (const account of this.data) {
        let credit = 0;
        let debit = 0;
        for (const transaction of account.transactions) {
          if (transaction.type === TransactionType.Credit) {
            credit += transaction.amount;
          } else if (transaction.type === TransactionType.Debit) {
            debit += transaction.amount;
          }
        }
        totalCredit = totalCredit.set(account.id, toDinero(credit, account.currency));
        totalDebit = totalDebit.set(account.id, toDinero(debit, account.currency));

        // Don't need this any more.
        delete account.transactions;
      }
      return [totalCredit, totalDebit];
    } catch (err) {
      throw err;
    }
  }

  private async validate(account: Account): Promise<void> {
    const duplicate = await repo(Account).findOne({ name: account.name, id: Not(account.id) });
    if (duplicate) {
      throw new Error(`Account with name ${account.name} already exists.`);
    }
  }

  put = flow(function*(this: AccountStore, account: Account) {
    try {
      yield this.validate(account);
      yield repo(Account).save(account);
      yield this.freshLoad();
    } catch (err) {
      throw err;
    }
  });

  delete = flow(function*(this: AccountStore, id: number) {
    try {
      yield repo(Account).delete(id);
      yield this.freshLoad();
    } catch (err) {
      throw err;
    }
  });
}
