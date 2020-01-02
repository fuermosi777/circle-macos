import { action, computed } from 'mobx';
import moment from 'moment';

import db from '../database';
import { ITransactionInstance } from '../interface/transaction';
import { formatDate } from '../utils/format';
import { notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { BaseDbStore } from './base_db_store';
import { RootStore } from './root_store';

interface IGroup {
  date: Date;
  transactions: ITransactionInstance[];
}

export class TransactionStore extends BaseDbStore<ITransactionInstance> {
  constructor(public rootStore: RootStore) {
    super('transactions');
  }

  // Override.
  @action
  async sync() {
    try {
      const transactions = await this.table
        .orderBy('date')
        .reverse()
        .offset(this.offset)
        .limit(this.limit)
        .toArray();
      const instances: ITransactionInstance[] = [];
      for (const transaction of transactions) {
        const instance: ITransactionInstance = {
          ...transaction,
          account: await db.accounts.get(transaction.accountId),
        };
        if (notEmpty(transaction.payeeId)) {
          instance.payee = await db.payees.get(transaction.payeeId);
        }
        if (notEmpty(transaction.from)) {
          instance.fromAccount = await db.accounts.get(transaction.from);
        }
        if (notEmpty(transaction.to)) {
          instance.toAccount = await db.accounts.get(transaction.to);
        }
        if (notEmpty(transaction.categoryId)) {
          instance.category = await db.categories.get(transaction.categoryId);
        }

        instances.push(instance);
      }

      this.data = instances;
    } catch (err) {
      logger.error(`Failed to sync instance from Transactions.`, err);
    }
  }

  @computed
  get groupedData(): Array<string | ITransactionInstance> {
    const uniqueDate = new Map<string, IGroup>();
    const groups: IGroup[] = [];
    for (const transaction of this.data) {
      const dateLabel = formatDate(transaction.date);
      if (!uniqueDate.has(dateLabel)) {
        const group: IGroup = {
          date: transaction.date,
          transactions: [],
        };
        uniqueDate.set(dateLabel, group);
        groups.push(group);
      }
      const existedGroup = uniqueDate.get(dateLabel);
      existedGroup.transactions.push(transaction);
    }
    groups.sort((g1, g2) => {
      if (moment(g1.date).isBefore(moment(g2.date))) {
        return 1;
      } else {
        return -1;
      }
    });
    const result: Array<string | ITransactionInstance> = [];
    for (const group of groups) {
      result.push(formatDate(group.date));
      for (const transaction of group.transactions) {
        result.push(transaction);
      }
    }

    return result;
  }
}
