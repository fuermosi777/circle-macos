import { flow, observable } from 'mobx';
import { Not, getRepository as repo } from 'typeorm';

import { Payee } from '../models/payee';
import { RootStore } from './root_store';

export class PayeeStore {
  @observable
  data: Payee[] = [];

  constructor(public rootStore: RootStore) {
    this.freshLoad(/* sync = */ false);
  }

  freshLoad = flow(function*(this: PayeeStore, sync = true) {
    try {
      this.data = yield repo(Payee).find({
        // TODO: why empty?
        name: Not(''),
      });
      if (sync) {
        this.rootStore.sync.up();
      }
    } catch (err) {
      throw err;
    }
  });
}
