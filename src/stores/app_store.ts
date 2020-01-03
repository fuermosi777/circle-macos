import { action, computed, observable } from 'mobx';

import { ISideItem, SideItemType, kAllAccountsIndex } from '../interface/app';
import { throttle } from '../utils/throttle';
import { RootStore } from './root_store';

const kSideWidthMin = 150;
const kSideWidthDefault = 250;
const kSideWidthMax = 400;

export class AppStore {
  @observable
  windowHeight = 0;

  @observable
  windowWidth = 0;

  @observable
  sideWidth = kSideWidthDefault;

  @observable
  selectedSideItem: ISideItem = {
    type: SideItemType.Account,
    index: kAllAccountsIndex,
  };

  @computed
  get mainWidth() {
    return this.windowWidth - this.sideWidth;
  }

  updateWindowSizeOp: () => void;

  constructor(public rootStore: RootStore) {
    this.updateWindowSizeOp = throttle(this.updateWindowSize.bind(this));
    window.addEventListener('resize', this.updateWindowSizeOp);
    this.updateWindowSizeOp();
  }

  @action
  updateWindowSize() {
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
  }

  @action
  updateSideWidth(width: number) {
    if (width > kSideWidthMin && width < kSideWidthMax) {
      this.sideWidth = width;
    }
  }

  @action
  updateSelectedSideItem(item: ISideItem) {
    this.selectedSideItem = item;
  }
}
