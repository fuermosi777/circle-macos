export const enum SideItemType {
  Account,
}

export const kAllAccountsIndex = -1;

export interface ISideItem {
  type: SideItemType;
  index?: number;
}
