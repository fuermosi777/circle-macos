import { Set } from 'immutable';
import { action, autorun, computed, flow, observable } from 'mobx';

import { ISideItem, SideItemType, kAllAccountsIndex } from '../interface/app';
import { Currency, IExchangeRawResult } from '../interface/currency';
import { isEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
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

  @observable
  exchangeRateStatus: 'pending' | 'done' | 'error' = 'pending';
  exchangeRates: IExchangeRawResult = null;

  @computed
  get mainWidth() {
    return this.windowWidth - this.sideWidth;
  }

  updateWindowSizeOp: () => void;

  constructor(public rootStore: RootStore) {
    this.updateWindowSizeOp = throttle(this.updateWindowSize.bind(this));
    window.addEventListener('resize', this.updateWindowSizeOp);
    this.updateWindowSizeOp();

    // Only fetch rates when main currency in profile is changed.
    autorun(() => {
      const base = rootStore.profile.profile.mainCurrency;
      let symbols = rootStore.account.data.map((account) => account.currency);
      symbols = Set<Currency>(symbols).toArray();
      if (isEmpty(base) || symbols.length === 0) {
        return;
      }
      this.fetchExchangeRates(base, symbols);
    });
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

  fetchExchangeRates = flow(function*(this: AppStore, base: Currency, symbols: Currency[]) {
    logger.info(`Fetch exchange rates.`);
    this.exchangeRateStatus = 'pending';
    try {
      const response = yield fetch(
        `https://api.exchangeratesapi.io/latest?base=${base}&symbols=${symbols.join(',')}`,
      );
      let { status } = response;
      if (status === 400) {
        throw new Error(`Status 400.`);
      }
      this.exchangeRates = yield response.json();
      this.exchangeRateStatus = 'done';
    } catch (err) {
      logger.error(`Failed to fetch exchange rates.`, err);
      this.exchangeRateStatus = 'error';
    }
  });
}
