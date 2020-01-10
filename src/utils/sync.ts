import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { remote } from 'electron';

import { logger } from './logger';

const kDatabaseName = 'circle-app-vault.sqlite';
export const databasePath = path.join(remote.app.getPath('userData'), kDatabaseName);
const icloudPath = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
export const icloudDatabasePath = path.join(icloudPath, remote.app.getName(), kDatabaseName);

// If local db file doesn't exist and cloud exists, copy cloud to local to start the connection.
export function preSync() {
  if (!fs.existsSync(databasePath) && fs.existsSync(icloudDatabasePath)) {
    return syncDown();
  } else {
    return Promise.resolve();
  }
}

export function syncDown() {
  return new Promise((resolve, reject) => {
    fs.copyFile(icloudDatabasePath, databasePath, (err) => {
      if (err) {
        reject(err);
      } else {
        logger.info(`Synced cloud database to local.`);
        resolve();
      }
    });
  });
}

export function syncUp() {
  return new Promise((resolve, reject) => {
    fs.copyFile(databasePath, icloudDatabasePath, (err) => {
      if (err) {
        reject(err);
      } else {
        logger.info(`Synced local database to cloud.`);
        resolve();
      }
    });
  });
}
