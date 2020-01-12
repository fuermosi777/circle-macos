export const enum SideItemType {
  Account,
  Reports,
}

export const kAllAccountsIndex = -1;

export interface ISideItem {
  type: SideItemType;
  index?: number;
}
