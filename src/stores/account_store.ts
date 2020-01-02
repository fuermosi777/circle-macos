import { action, observable, reaction } from 'mobx';

import db from '../database';
import { IAccount } from '../interface/account';
import { TransactionType } from '../interface/transaction';
import { notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';
import { RootStore } from './root_store';

export class AccountStore {
  @observable
  data: IAccount[] = [];

  @observable
  runningBalance: { [accountId: number]: Dinero.Dinero } = {};

  constructor(public rootStore: RootStore) {
    this.sync();

    reaction(
      () => this.data.map((account) => account.balance),
      async () => {
        await this.updateRuningBalance();
      },
    );
  }

  @action
  async sync() {
    try {
      this.data = await db.accounts.orderBy('name').toArray();
    } catch (err) {
      logger.error(err);
    }
  }

  @action
  async updateRuningBalance() {
    try {
      for (const account of this.data) {
        let rb = toDinero(account.balance, account.currency);
        const transactions = await db.transactions.toArray();
        for (const transaction of transactions) {
          if (transaction.accountId !== account.id) {
            continue;
          }
          const amount = toDinero(transaction.amount, account.currency);
          if (account.isCredit) {
            if (transaction.type === TransactionType.Credit) {
              rb = rb.add(amount);
            } else if (transaction.type === TransactionType.Debit) {
              rb = rb.subtract(amount);
            }
          } else {
            if (transaction.type === TransactionType.Credit) {
              rb = rb.subtract(amount);
            } else if (transaction.type === TransactionType.Debit) {
              rb = rb.add(amount);
            }
          }
        }
        this.runningBalance[account.id] = rb;
      }
    } catch (err) {
      throw err;
    }
  }

  @action
  async delete(id: number) {
    try {
      await db.accounts.delete(id);
      await this.sync();
    } catch (err) {
      throw err;
    }
  }

  @action
  async put(account: IAccount) {
    try {
      await db.accounts.put(account);
      await this.sync();
    } catch (err) {
      throw err;
    }
  }

  getRuningBalance(accountId: number): string {
    if (notEmpty(this.runningBalance[accountId])) {
      return this.runningBalance[accountId].toFormat('$0,0.00');
    }

    return '';
  }
}
