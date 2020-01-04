import * as path from 'path';

import { remote } from 'electron';
import { Connection, createConnection, getRepository as repo } from 'typeorm';

import { Account } from '../models/account';
import { Category, CategoryType } from '../models/category';
import { Payee } from '../models/payee';
import { Transaction } from '../models/transaction';
import { logger } from './logger';

const kDatabaseName = 'db.sqlite';
const databasePath = path.join(remote.app.getPath('userData'), kDatabaseName);

export function getConnection() {
  logger.info(`Database location: ${databasePath}`);
  return createConnection({
    type: 'sqlite',
    synchronize: true,
    logging: true,
    logger: 'simple-console',
    database: databasePath,
    entities: [Category, Account, Transaction, Payee],
  });
}

// Insert default data to a blank database.
export async function initDatabase(conn: Connection) {
  try {
    let categories = await repo(Category).find();
    if (categories.length > 0) {
      return;
    }
    await conn
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values([
        { name: 'Eat & Drinks', type: CategoryType.Expense },
        { name: 'Transport', type: CategoryType.Expense },
        { name: 'Groceries', type: CategoryType.Expense },
        { name: 'Clothes & Shoes', type: CategoryType.Expense },
        { name: 'Household', type: CategoryType.Expense },
        { name: 'Gifts', type: CategoryType.Expense },
        { name: 'Communications', type: CategoryType.Expense },
        { name: 'Entertainment', type: CategoryType.Expense },
        { name: 'Health', type: CategoryType.Expense },
        { name: 'Others', type: CategoryType.Expense },
      ])
      .execute();
  } catch (err) {
    throw err;
  }
}
