import { flow, observable } from 'mobx';
import { getRepository as repo } from 'typeorm';

import { Category } from '../models/category';
import { RootStore } from './root_store';

export class CategoryStore {
  @observable
  data: Category[];

  constructor(public rootStore: RootStore) {
    this.freshLoad();
  }

  freshLoad = flow(function*(this: CategoryStore) {
    try {
      const categories = yield repo(Category).find();
      this.data = categories;
    } catch (err) {
      throw err;
    }
  });
}
