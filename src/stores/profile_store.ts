import { action, observable } from 'mobx';

import { IProfile } from '../interface/profile';
import profileManager from '../utils/profile';
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

  @action
  set(key: keyof IProfile, value: any) {
    Reflect.set(this.profile, key, value);
    profileManager.set(key, value);
  }
}
