import { AccountStore } from './account_store';
import { AppStore } from './app_store';
import { CategoryStore } from './category_store';
import { ModalStore } from './modal_store';
import { PayeeStore } from './payee_store';
import { TransactionListStore } from './transaction_list_store';
import { TransactionStore } from './transaction_store';

class RootStore {
  modal: ModalStore;
  account: AccountStore;
  app: AppStore;
  payee: PayeeStore;
  category: CategoryStore;
  transaction: TransactionStore;
  transactionList: TransactionListStore;

  constructor() {
    this.modal = new ModalStore(this);
    this.account = new AccountStore(this);
    this.app = new AppStore(this);
    this.payee = new PayeeStore(this);
    this.category = new CategoryStore(this);
    this.transaction = new TransactionStore(this);
    this.transactionList = new TransactionListStore(this);
  }
}

const rootStore = new RootStore();

export { RootStore, rootStore };
