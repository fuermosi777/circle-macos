import * as React from 'react';

import { Gap } from './gap';

interface IProps {
  title?: string;
}

export const InputField: React.FunctionComponent<IProps> = (props) => (
  <div className='InputField'>
    {props.title && <div className='title'>{props.title}</div>}
    {props.children}
    <Gap size={15}></Gap>
  </div>
);
