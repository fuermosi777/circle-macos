import * as fs from 'fs';
import * as path from 'path';

import { remote } from 'electron';

import { Currency } from '../interface/currency';
import { IProfile } from '../interface/profile';
import { logger } from './logger';

const kLocalProfilePath = path.join(remote.app.getPath('userData'), 'local_profile.json');

const defaultProfile: IProfile = {
  showBalanceOnSide: true,
  mainCurrency: Currency.USD,
};

class ProfileManager {
  profile: IProfile;

  prepareLocalProfile() {
    let localProfileContent: string;
    try {
      localProfileContent = fs.readFileSync(kLocalProfilePath, 'utf8');
    } catch (err) {
      logger.warn(`Failed to open local profile. Delete and create a new one.`, err);
      fs.writeFileSync(kLocalProfilePath, JSON.stringify(defaultProfile), 'utf8');
    }

    try {
      this.profile = JSON.parse(localProfileContent) as IProfile;
    } catch (err) {
      logger.warn(`Failed to parsed store profile. Use default one instead.`, err);
      this.profile = defaultProfile;
    }

    // Update local file with new configs.
    for (const key in defaultProfile) {
      if (!Reflect.has(this.profile, key)) {
        Reflect.set(this.profile, key, Reflect.get(defaultProfile, key));
      }
    }

    logger.info(`Local profile loaded.`, this.profile);

    this.writeLocalProfile();
  }

  writeLocalProfile() {
    fs.writeFileSync(kLocalProfilePath, JSON.stringify(this.profile), 'utf8');
  }

  set(key: keyof IProfile, value: any) {
    Reflect.set(this.profile, key, value);
    this.writeLocalProfile();
  }
}

export default new ProfileManager();
