import { Map } from 'immutable';
import { flow, observable, reaction } from 'mobx';
import { Not, getRepository as repo } from 'typeorm';

import { Account } from '../models/account';
import { logger } from '../utils/logger';
import { RootStore } from './root_store';

export class AccountStore {
  @observable
  data: Account[] = [];

  constructor(public rootStore: RootStore) {
    this.freshLoad();

    reaction(
      () => this.data.map((account) => account.balance),
      () => {
        this.updateRuningBalance();
      },
    );
  }

  freshLoad = flow(function*(this: AccountStore) {
    try {
      this.data = yield repo(Account).find({
        order: {
          name: 'ASC',
        },
      });
    } catch (err) {
      logger.error(err);
    }
  });

  updateRuningBalance = flow(function*(this: AccountStore) {
    try {
      let balanceMap: Map<number, Dinero.Dinero> = Map();
      // const transactions = yield db.transactions.toArray();
      // for (const account of this.data) {
      //   let rb = account.balance;
      //   for (const transaction of transactions) {
      //     if (transaction.accountId !== account.id) {
      //       continue;
      //     }
      //     if (account.isCredit) {
      //       if (transaction.type === TransactionType.Credit) {
      //         rb += transaction.amount;
      //       } else if (transaction.type === TransactionType.Debit) {
      //         rb -= transaction.amount;
      //       }
      //     } else {
      //       if (transaction.type === TransactionType.Credit) {
      //         rb -= transaction.amount;
      //       } else if (transaction.type === TransactionType.Debit) {
      //         rb += transaction.amount;
      //       }
      //     }
      //   }
      //   balanceMap = balanceMap.set(account.id, toDinero(rb, account.currency));
      // }
      // this.runningBalance = balanceMap;
    } catch (err) {
      throw err;
    }
  });

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
