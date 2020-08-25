import { Map } from 'immutable';
import { flow, observable } from 'mobx';
import { Not, getRepository as repo } from 'typeorm';

import { IBalance } from '../interface/app';
import { Account } from '../models/account';
import { logger } from '../utils/logger';
import { calculateBalance, toDinero } from '../utils/money';
import { RootStore } from './root_store';

type AccountInfo = Map<number, Dinero.Dinero>;

export class AccountStore {
  @observable
  data: Account[] = [];

  @observable.ref
  totalCreditPending: AccountInfo = Map();

  @observable.ref
  totalCreditCleared: AccountInfo = Map();

  @observable.ref
  totalDebitPending: AccountInfo = Map();

  @observable.ref
  totalDebitCleared: AccountInfo = Map();

  constructor(public rootStore: RootStore) {
    this.freshLoad(/* sync = */ false);
  }

  freshLoad = flow(function*(this: AccountStore, sync = true) {
    try {
      this.data = yield repo(Account).find({
        order: {
          name: 'ASC',
        },
        relations: ['transactions'],
      });
      const balance = this.updateBalance();
      this.totalCreditPending = balance.pendingCredit;
      this.totalCreditCleared = balance.clearedCredit;
      this.totalDebitPending = balance.pendingDebit;
      this.totalDebitCleared = balance.clearedDebit;

      if (sync) {
        this.rootStore.sync.up();
      }
    } catch (err) {
      logger.error(err);
    }
  });

  // TODO: when transactions is updated, re-calculate.
  private updateBalance(): IBalance<AccountInfo> {
    try {
      let totalBalance: IBalance<AccountInfo> = {
        pendingCredit: Map(),
        pendingDebit: Map(),
        clearedCredit: Map(),
        clearedDebit: Map(),
      };
      for (const account of this.data) {
        let balance = calculateBalance(account.transactions);
        totalBalance.pendingDebit = totalBalance.pendingDebit.set(
          account.id,
          toDinero(balance.pendingDebit, account.currency),
        );
        totalBalance.pendingCredit = totalBalance.pendingCredit.set(
          account.id,
          toDinero(balance.pendingCredit, account.currency),
        );
        totalBalance.clearedCredit = totalBalance.clearedCredit.set(
          account.id,
          toDinero(balance.clearedCredit, account.currency),
        );
        totalBalance.clearedDebit = totalBalance.clearedDebit.set(
          account.id,
          toDinero(balance.clearedDebit, account.currency),
        );

        // Don't need this any more.
        delete account.transactions;
      }
      return totalBalance;
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
