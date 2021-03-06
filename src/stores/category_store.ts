import { flow, observable } from 'mobx';
import { getRepository as repo } from 'typeorm';

import { Category } from '../models/category';
import { RootStore } from './root_store';

export class CategoryStore {
  @observable
  data: Category[];

  constructor(public rootStore: RootStore) {
    this.freshLoad(/* sync = */ false);
  }

  freshLoad = flow(function*(this: CategoryStore, sync = true) {
    try {
      const categories = yield repo(Category).find();
      this.data = categories;
      if (sync) {
        this.rootStore.sync.up();
      }
    } catch (err) {
      throw err;
    }
  });
}
