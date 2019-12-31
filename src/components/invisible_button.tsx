import * as React from 'react';

interface IProps {
  icon?: JSX.Element;
  label?: string;
  onClick?(): void;
}

export const InvisibleButton: React.FunctionComponent<IProps> = (props) => {
  return (
    <div className='InvisibleButton' onClick={props.onClick || undefined}>
      {props.icon || null}
      {props.label && <div className='label'>{props.label}</div>}
    </div>
  );
};
