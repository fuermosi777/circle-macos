import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { remote } from 'electron';

import { IProfile } from '../interface/profile';
import { logger } from './logger';

const kDatabaseName = 'circle-app-vault.sqlite';
export const databasePath = path.join(remote.app.getPath('userData'), kDatabaseName);
const icloudPath = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
const icloudDatabasePath = path.join(icloudPath, remote.app.getName(), kDatabaseName);

const kLocalProfilePath = path.join(remote.app.getPath('userData'), 'local_profile.json');

const defaultProfile: IProfile = {
  databasePath: icloudDatabasePath,
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
      this.profile = defaultProfile;
    }
  }

  writeLocalProfile() {
    fs.writeFileSync(kLocalProfilePath, JSON.stringify(this.profile), 'utf8');
  }
}

export default new ProfileManager();
