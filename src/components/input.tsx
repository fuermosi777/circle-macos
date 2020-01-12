import { Set } from 'immutable';
import * as React from 'react';

import { filterBy } from '../utils/helper';

interface IProps {
  label?: string;
  placeholder?: string;
  value: string;
  // If true, disable user input, only selection will work.
  isSelect?: boolean;
  options?: string[];
  // Whether filter options menu based on existing text.
  filterOptions?: boolean;
  // Options which will be on top for quicker selection.
  quickOptions?: string[];
  onChange(text: string): void;
}

interface IOptionLabelProps {
  label: string;
  onClick(label: string): void;
}

const OptionLabel = (props: IOptionLabelProps) => {
  return (
    <div className='option-label' onMouseDown={() => props.onClick(props.label)}>
      {props.label}
    </div>
  );
};

export const Input: React.FunctionComponent<IProps> = (props) => {
  const { filterOptions = true, isSelect = false } = props;
  const [showOptions, setShowOptions] = React.useState(false);
  const quickOptionMap = Set<string>(props.quickOptions || []);

  // Starting with value, and also exlude anything from quick options.
  function getFilteredOptions(): string[] {
    let options = props.options;
    if (!filterOptions) {
      return options;
    }
    options = filterBy(props.value, props.options, quickOptionMap);
    return options;
  }

  function handleInputBlur() {
    if (setShowOptions && showOptions) {
      setShowOptions(false);
    }
  }

  function handleOptionClick(option: string) {
    props.onChange(option);
    setShowOptions(false);
  }

  function hasQuickOptions() {
    return props.quickOptions && props.quickOptions.length > 0;
  }

  function handleKeyDown(e: any) {
    if (props.isSelect) {
      e.preventDefault();
      return;
    }
  }

  return (
    <div className={`Input ${isSelect ? 'select' : ''}`}>
      {props.label && <div className='label'>{props.label}</div>}
      <input
        type='text'
        placeholder={props.placeholder || ''}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onFocus={() => setShowOptions(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      {showOptions && props.options && props.options.length > 0 && (
        <div className='options'>
          {hasQuickOptions() && (
            <div className='option-group'>
              {props.quickOptions.map((opt) => (
                <OptionLabel key={opt} label={opt} onClick={handleOptionClick} />
              ))}
            </div>
          )}
          {hasQuickOptions() && <div className='option-divider'></div>}
          <div className='options-group'>
            {getFilteredOptions().map((opt) => (
              <OptionLabel key={opt} label={opt} onClick={handleOptionClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
