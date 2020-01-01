import Dexie from 'dexie';
import { action, observable } from 'mobx';

import db from '../database';
import { logger } from '../utils/logger';

export class BaseDbStore<T> {
  @observable
  data: T[] = [];

  protected table: Dexie.Table<T, number> = db[this.tableName as keyof typeof db] as any;

  constructor(public tableName: string) {
    this.sync();
  }

  @action
  async get(where: { [key: string]: any }): Promise<T | null> {
    try {
      return await this.table.get(where);
    } catch (err) {
      throw err;
    }
  }

  @action
  async put(item: T): Promise<void> {
    try {
      await this.table.put(item);
      await this.sync();
    } catch (err) {
      logger.error(`Failed to put record.`, item, err);
      throw err;
    }
  }

  // No unique check, just add.
  @action
  async add(dotum: T): Promise<number> {
    try {
      const dotumId = await this.table.add(dotum);
      await this.sync();
      return dotumId;
    } catch (err) {
      logger.error(`Failed to add new record to ${this.tableName}.`, err);
      throw err;
    }
  }

  @action
  async delete(id: number): Promise<void> {
    try {
      await this.table.delete(id);
      await this.sync();
    } catch (err) {
      logger.error(`Failed to delete id=${id} in ${this.tableName}`, err);
      throw err;
    }
  }

  @action
  protected async sync() {
    try {
      this.data = await this.table
        .orderBy('id')
        .reverse()
        .toArray();
    } catch (err) {
      logger.error(`Failed to sync from ${this.tableName}.`, err);
    }
  }
}
