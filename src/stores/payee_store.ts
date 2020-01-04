import { flow, observable } from 'mobx';
import { getRepository as repo } from 'typeorm';

import { Payee } from '../models/payee';
import { RootStore } from './root_store';

export class PayeeStore {
  @observable
  data: Payee[] = [];

  constructor(public rootStore: RootStore) {
    this.freshLoad();
  }

  freshLoad = flow(function*() {
    try {
      this.data = yield repo(Payee).find();
    } catch (err) {
      throw err;
    }
  });
}
