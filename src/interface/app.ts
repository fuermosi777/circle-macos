export const enum SideItemType {
  Account,
  Reports,
}

export const enum ReportsItem {
  Assets,
}

export const kAllAccountsIndex = -1;

export interface ISideItem {
  type: SideItemType;
  index?: number;
}

export interface IBalance<T> {
  pendingCredit: T;
  pendingDebit: T;
  clearedCredit: T;
  clearedDebit: T;
}
