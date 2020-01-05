import 'reflect-metadata';

import './index.less';

import * as React from 'react';
import ReactDOM from 'react-dom';

import { getConnection, initDatabase } from './utils/database';
import { logger } from './utils/logger';
import profileManager from './utils/profile';

profileManager.prepareLocalProfile();

getConnection()
  .then(async (connection) => {
    await initDatabase(connection);
    // Late import to make sure connection is set up.
    const { App } = await import('./components/app');
    ReactDOM.render(React.createElement(App), document.getElementById('root'));
  })
  .catch((err) => {
    logger.error(`Failed to create connection.`, err);
  });
