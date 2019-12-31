import * as React from 'react';

interface IProps {
  label: string;

  small?: boolean;
  medium?: boolean;
  large?: boolean;

  focusing?: boolean;

  disabled?: boolean;

  onClick?(): void;
}

export const Button = (props: IProps) => {
  let className = 'Button';
  function addClass(name: string) {
    className += ' ' + name;
  }

  if (props.small) {
    addClass('small');
  } else if (props.large) {
    addClass('large');
  } else {
    addClass('medium');
  }

  if (props.focusing) {
    addClass('focusing');
  }

  if (props.disabled) {
    addClass('disabled');
  }
  return (
    <button className={className} onClick={props.onClick}>
      {props.label}
    </button>
  );
};
