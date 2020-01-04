import { List } from 'immutable';
import { computed, flow, observable } from 'mobx';
import moment from 'moment';
import { FindManyOptions, getRepository as repo } from 'typeorm';

import { SideItemType, kAllAccountsIndex } from '../interface/app';
import { Transaction } from '../models/transaction';
import { formatDate } from '../utils/format';
import { isEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { RootStore } from './root_store';

interface IGroup {
  date: Date;
  transactions: Transaction[];
}

const kDefaultPageSize = 50;

export class TransactionStore {
  private offset = 0;
  private limit = kDefaultPageSize;
  private order = 'date';

  isLoading = false;

  constructor(public rootStore: RootStore) {
    this.freshLoad();
  }

  @observable.ref
  data: List<Transaction> = List();

  freshLoad = flow(function*(this: TransactionStore) {
    try {
      this.clear();
      yield this.loadMore();
    } catch (err) {
      logger.error(`Failed to sync instance from Transactions.`, err);
    }
  });

  reload = flow(function*(this: TransactionStore) {
    try {
      this.clear();

      this.offset = 0;
      this.limit = this.data.size;
      yield this.loadMore();
      this.limit = 0;
    } catch (err) {
      throw err;
    }
  });

  loadMore = flow(function*(this: TransactionStore) {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      const query: FindManyOptions<Transaction> = {
        skip: this.offset,
        take: this.limit,
        relations: ['account', 'payee', 'category', 'from', 'to', 'sibling'],
        order: {
          [this.order]: 'DESC',
        },
      };
      const selectedSideItem = this.rootStore.app.selectedSideItem;
      if (
        selectedSideItem.type === SideItemType.Account &&
        selectedSideItem.index > kAllAccountsIndex
      ) {
        query.where = { accountId: selectedSideItem.index };
      }
      console.log(query);
      const transactions = yield repo(Transaction).find(query);

      this.data = this.data.concat(List(transactions));
      this.offset += transactions.length;
    } catch (err) {
      throw err;
    } finally {
      this.isLoading = false;
    }
  });

  delete = flow(function*(this: TransactionStore, id: number) {
    try {
      yield repo(Transaction).delete(id);
      yield this.reload();
    } catch (err) {
      throw err;
    }
  });

  @computed
  get groupedData(): Array<string | Transaction> {
    const uniqueDate = new Map<string, IGroup>();
    const groups: IGroup[] = [];

    this.data.forEach((transaction) => {
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
    });

    groups.sort((g1, g2) => {
      if (moment(g1.date).isBefore(moment(g2.date))) {
        return 1;
      } else {
        return -1;
      }
    });
    const result: Array<string | Transaction> = [];
    for (const group of groups) {
      result.push(formatDate(group.date));
      for (const transaction of group.transactions) {
        result.push(transaction);
      }
    }

    return result;
  }

  private clear() {
    this.offset = 0;
    this.data = List();
  }
}
