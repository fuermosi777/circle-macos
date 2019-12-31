import * as React from 'react';

interface IProps {
  // Default is horizontal.
  vertical?: boolean;
  size: number;
}

export const Gap: React.FunctionComponent<IProps> = (props) => {
  let style: React.CSSProperties = {
    width: '100%',
    height: props.size,
  };
  if (props.vertical) {
    style = {
      height: '100%',
      width: props.size,
    };
  }
  return <div className={`Gap`} style={style}></div>;
};
