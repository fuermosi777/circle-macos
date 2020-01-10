import * as fs from 'fs';

import { flow, observable } from 'mobx';
import moment from 'moment';
import { getConnection as getConn } from 'typeorm';

import { getConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { databasePath, icloudDatabasePath, syncDown, syncUp } from '../utils/sync';
import { RootStore } from './root_store';

// Time used to copy from local to cloud.
const kCopyTimeThreshold = 30; // seconds

export class SyncStore {
  @observable
  isSyncing = false;

  constructor(public rootStore: RootStore) {
    this.init();

    // TODO: add a listener to cloud for new changes.
  }

  init() {
    if (fs.existsSync(icloudDatabasePath)) {
      const cloudStats = fs.statSync(icloudDatabasePath);
      const localStats = fs.statSync(databasePath);

      // Needs to clone the newer db from cloud.
      if (
        moment(localStats.mtime).isBefore(
          moment(cloudStats.mtime).subtract(kCopyTimeThreshold, 'seconds'),
        )
      ) {
        this.down()
          .then(() => {
            logger.info(`Closing database connection due to updated db file.`);
            return getConn().close();
          })
          .catch((err) => {
            logger.error(`Failed to close the connection.`, err);
          })
          .then(() => {
            logger.info(`Re-create the connection...`);
            return getConnection();
          })
          .catch((err) => {
            logger.error(`Failed to recreate the connection.`, err);
          });
      }
    } else {
      this.up();
    }
  }

  down = flow(function*(this: SyncStore) {
    if (this.isSyncing) {
      return;
    }
    try {
      this.isSyncing = true;
      yield syncDown();
    } catch (err) {
      throw err;
    } finally {
      this.isSyncing = false;
    }
  });

  up = flow(function*(this: SyncStore) {
    if (this.isSyncing) {
      return;
    }
    try {
      this.isSyncing = true;
      yield syncUp();
    } catch (err) {
      throw err;
    } finally {
      this.isSyncing = false;
    }
  });
}
