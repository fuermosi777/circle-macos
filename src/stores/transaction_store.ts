import { List } from 'immutable';
import { action, computed, flow, observable } from 'mobx';
import moment from 'moment';
import { FindManyOptions, getRepository as repo } from 'typeorm';

import { SideItemType, kAllAccountsIndex } from '../interface/app';
import { Transaction } from '../models/transaction';
import { formatDate } from '../utils/format';
import { notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { deleteTransaction } from '../utils/operations';
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

  @observable
  selectedTransactionId: number;

  constructor(public rootStore: RootStore) {
    this.freshLoad(/* sync = */ false);
  }

  @observable.ref
  data: List<Transaction> = List();

  freshLoad = flow(function*(this: TransactionStore, sync = true) {
    try {
      this.clear();
      this.data = yield this.load(sync);
    } catch (err) {
      logger.error(`Failed to sync instance from Transactions.`, err);
    }
  });

  reload = flow(function*(this: TransactionStore, sync = true) {
    try {
      this.offset = 0;
      this.limit = this.data.size;

      this.data = yield this.load(sync);
      this.limit = kDefaultPageSize;
    } catch (err) {
      throw err;
    }
  });

  // Sync is a boolean whether to sync the database to cloud.
  private load = flow(function*(this: TransactionStore, sync = true) {
    try {
      const query: FindManyOptions<Transaction> = {
        skip: this.offset,
        take: this.limit,
        relations: ['account', 'payee', 'category', 'from', 'to', 'sibling'],
        order: {
          [this.order]: 'DESC',
          id: 'DESC',
        },
      };
      const selectedSideItem = this.rootStore.app.selectedSideItem;
      if (
        selectedSideItem.type === SideItemType.Account &&
        selectedSideItem.index > kAllAccountsIndex
      ) {
        query.where = { accountId: selectedSideItem.index };
      }
      const transactions = yield repo(Transaction).find(query);

      this.offset += transactions.length;
      if (sync) {
        this.rootStore.sync.up();
      }

      return List(transactions);
    } catch (err) {
      throw err;
    }
  });

  loadMore = flow(function*(this: TransactionStore) {
    try {
      let moreData: List<Transaction> = yield this.load(/* sync = */ false);
      moreData = this.data.concat(moreData);
      this.data = moreData;
    } catch (err) {
      throw err;
    }
  });

  delete = flow(function*(this: TransactionStore, id: number) {
    try {
      yield deleteTransaction(id);
      yield this.reload();
    } catch (err) {
      throw err;
    }
  });

  bulkDelete = flow(function*(this: TransactionStore, ids: number[]) {
    try {
      for (const id of ids) {
        yield deleteTransaction(id);
      }
      yield this.reload();
    } catch (err) {
      throw err;
    }
  });

  @action
  selectTransaction(id: number) {
    this.selectedTransactionId = id;
  }

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

  @action
  private clear() {
    this.offset = 0;
    this.limit = kDefaultPageSize;
  }
}
