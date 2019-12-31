import * as React from 'react';

interface IProps {
  isVisible: boolean;
  onClose(): void;
}

const Modal: React.FunctionComponent<IProps> = (props) =>
  props.isVisible ? (
    <div className='Modal'>
      <div className='modal-box'>{props.children}</div>
    </div>
  ) : null;

export { Modal };
