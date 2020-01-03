import { List } from 'immutable';
import { computed, flow, observable } from 'mobx';
import moment from 'moment';

import db from '../database';
import { SideItemType, kAllAccountsIndex } from '../interface/app';
import { ITransactionInstance } from '../interface/transaction';
import { formatDate } from '../utils/format';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { RootStore } from './root_store';

interface IGroup {
  date: Date;
  transactions: ITransactionInstance[];
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
  data: List<ITransactionInstance> = List();

  freshLoad = flow(function*(this: TransactionStore) {
    try {
      this.clear();
      yield this.loadMore();
    } catch (err) {
      logger.error(`Failed to sync instance from Transactions.`, err);
    }
  });

  partialLoad = flow(function*(this: TransactionStore, id: number) {
    try {
      const transaction = yield db.transactions.get(id);
      if (isEmpty(transaction)) {
        this.data = this.data.filterNot((transaction) => transaction.id === id);
      } else {
        let indexToReplace = this.data.findIndex((transaction) => transaction.id === id);
        if (indexToReplace > -1) {
          this.data = this.data.set(indexToReplace, transaction);
        }
      }
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
      let query: any = db.transactions;
      let selectedSideItem = this.rootStore.app.selectedSideItem;
      if (
        selectedSideItem.type === SideItemType.Account &&
        selectedSideItem.index > kAllAccountsIndex
      ) {
        query = query.where({ accountId: selectedSideItem.index });
      }
      query = query
        .orderBy(this.order)
        .reverse()
        .offset(this.offset)
        .limit(this.limit);

      const transactions = yield query.toArray();
      const instances: ITransactionInstance[] = [];
      for (const transaction of transactions) {
        const instance: ITransactionInstance = {
          ...transaction,
          account: yield db.accounts.get(transaction.accountId),
        };
        if (notEmpty(transaction.payeeId)) {
          instance.payee = yield db.payees.get(transaction.payeeId);
        }
        if (notEmpty(transaction.from)) {
          instance.fromAccount = yield db.accounts.get(transaction.from);
        }
        if (notEmpty(transaction.to)) {
          instance.toAccount = yield db.accounts.get(transaction.to);
        }
        if (notEmpty(transaction.categoryId)) {
          instance.category = yield db.categories.get(transaction.categoryId);
        }

        instances.push(instance);
      }

      this.data = this.data.concat(List(instances));
      this.offset += instances.length;
    } catch (err) {
      throw err;
    } finally {
      this.isLoading = false;
    }
  });

  delete = flow(function*(this: TransactionStore, id: number) {
    try {
      yield db.transactions.delete(id);
      yield this.partialLoad(id);
    } catch (err) {
      throw err;
    }
  });

  @computed
  get groupedData(): Array<string | ITransactionInstance> {
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
    const result: Array<string | ITransactionInstance> = [];
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
