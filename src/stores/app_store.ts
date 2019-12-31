import { action, computed, decorate, observable } from 'mobx';

import { throttle } from '../utils/throttle';
import { RootStore } from './root_store';

const kSideWidthMin = 150;
const kSideWidthDefault = 250;
const kSideWidthMax = 400;

export class AppStore {
  windowHeight = 0;
  windowWidth = 0;
  sideWidth = kSideWidthDefault;

  get mainWidth() {
    return this.windowWidth - this.sideWidth;
  }

  updateWindowSizeOp: () => void;

  constructor(public rootStore: RootStore) {
    this.updateWindowSizeOp = throttle(this.updateWindowSize.bind(this));
    window.addEventListener('resize', this.updateWindowSizeOp);
    this.updateWindowSizeOp();
  }

  updateWindowSize() {
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
  }

  updateSideWidth(width: number) {
    if (width > kSideWidthMin && width < kSideWidthMax) {
      this.sideWidth = width;
    }
  }
}

decorate(AppStore, {
  windowHeight: observable,
  windowWidth: observable,
  sideWidth: observable,
  mainWidth: computed,

  updateWindowSize: action,
  updateSideWidth: action,
});
