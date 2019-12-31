export enum CategoryType {
  Expense,
  Income,
}

export interface IRawCategory {
  name: string;
  type: 'expense' | 'income';
}

export interface ICategory {
  id?: number;
  type: CategoryType;
  name: string;
}
