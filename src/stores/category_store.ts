import { CategoryType, ICategory, IRawCategory } from '../interface/category';
import { logger } from '../utils/logger';
import { BaseDbStore } from './base_db_store';
import { RootStore } from './root_store';

const defaultCateogires: IRawCategory[] = [
  { name: 'Eat & Drinks', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Clothes & Shoes', type: 'expense' },
  { name: 'Household', type: 'expense' },
  { name: 'Gifts', type: 'expense' },
  { name: 'Communications', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Others', type: 'expense' },
];

export class CategoryStore extends BaseDbStore<ICategory> {
  constructor(public rootStore: RootStore) {
    super('categories');
    this.reset();
  }

  // Initialize the store with default values.
  // Only run this at very beginning. Avaiable for reset.
  async reset(force = false) {
    try {
      const records = await this.table.toArray();
      if (records.length > 0 && !force) {
        return;
      }

      let counter = 0;
      for (const raw of defaultCateogires) {
        const existed = await this.table.where({ name: raw.name }).limit(1);

        if (existed) {
          logger.info(`Trying to add category with name "${raw.name}" but it already exists.`);
        }

        const category: ICategory = {
          name: raw.name,
          type: raw.type === 'expense' ? CategoryType.Expense : CategoryType.Income,
        };

        await this.add(category);
        counter++;
      }
      logger.info(`Reset categories done. Added ${counter} categories.`);
    } catch (err) {
      throw err;
    }
  }
}
