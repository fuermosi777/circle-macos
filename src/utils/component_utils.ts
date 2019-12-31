import * as React from 'react';

export function stopEvent(e: React.SyntheticEvent<HTMLElement>) {
  e.preventDefault();
}
