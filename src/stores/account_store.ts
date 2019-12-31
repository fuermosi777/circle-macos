import { IAccount } from '../interface/account';
import { BaseDbStore } from './base_db_store';
import { RootStore } from './root_store';

export class AccountStore extends BaseDbStore<IAccount> {
  constructor(public rootStore: RootStore) {
    super('accounts');
  }

  // async function getAccounts() {
  //   try {

  //   } catch (err) {
  //     throw err;
  //   }
  // }
}
