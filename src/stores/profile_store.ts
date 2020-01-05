import { action, observable } from 'mobx';

import { IProfile } from '../interface/profile';
import profileManager, { databasePath } from '../utils/profile';
import { RootStore } from './root_store';

export class ProfileStore {
  @observable
  profile: IProfile;

  constructor(public rootStore: RootStore) {
    this.setup();
  }

  @action
  private setup() {
    this.profile = profileManager.profile;
  }
}
