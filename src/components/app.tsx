import { observer } from 'mobx-react';
import * as React from 'react';

import { rootStore } from '../stores/root_store';
import { Main } from './main';
import { Modal } from './modal';
import { Side } from './side';
import { TopMenu } from './top_menu';

const App = observer(() => {
  return (
    <div className='App theme__default'>
      <TopMenu />
      <Side />
      <Main />

      <Modal isVisible={rootStore.modal.showModal} onClose={() => rootStore.modal.closeModal()}>
        {rootStore.modal.modalContent}
      </Modal>
    </div>
  );
});

export { App };
