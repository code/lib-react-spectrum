/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ActionButtonStyleProps, btnStyles} from './ActionButton';
import {centerBaseline} from './CenterBaseline';
import {FocusableRef} from '@react-types/shared';
import {fontRelative, style} from '../style/spectrum-theme' with {type: 'macro'};
import {forwardRef, ReactNode} from 'react';
import {IconContext} from './Icon';
import {pressScale} from './pressScale';
import {Provider, ToggleButton as RACToggleButton, ToggleButtonProps as RACToggleButtonProps} from 'react-aria-components';
import {StyleProps} from './style-utils';
import {Text, TextContext} from './Content';
import {useFocusableRef} from '@react-spectrum/utils';

export interface ToggleButtonProps extends Omit<RACToggleButtonProps, 'className' | 'style' | 'children' | 'onHover' | 'onHoverStart' | 'onHoverEnd' | 'onHoverChange'>, StyleProps, ActionButtonStyleProps {
  /** The content to display in the button. */
  children?: ReactNode,
  /** Whether the button should be displayed with an [emphasized style](https://spectrum.adobe.com/page/action-button/#Emphasis). */
  isEmphasized?: boolean
}

function ToggleButton(props: ToggleButtonProps, ref: FocusableRef<HTMLButtonElement>) {
  let domRef = useFocusableRef(ref);
  return (
    <RACToggleButton
      {...props}
      ref={domRef}
      style={pressScale(domRef, props.UNSAFE_style)}
      className={renderProps => (props.UNSAFE_className || '') + btnStyles({
        ...renderProps,
        staticColor: props.staticColor,
        size: props.size,
        isQuiet: props.isQuiet,
        isEmphasized: props.isEmphasized
      }, props.styles)}>
      <Provider
        values={[
          [TextContext, {className: style({paddingY: '--labelPadding', order: 1})}],
          [IconContext, {
            render: centerBaseline({slot: 'icon', className: style({order: 0})}),
            styles: style({size: fontRelative(20), marginStart: '--iconMargin', flexShrink: 0})
          }]
        ]}>
        {typeof props.children === 'string' ? <Text>{props.children}</Text> : props.children}
      </Provider>
    </RACToggleButton>
  );
}

/**
 * ToggleButtons allow users to toggle a selection on or off, for example
 * switching between two states or modes.
 */
let _ToggleButton = forwardRef(ToggleButton);
export {_ToggleButton as ToggleButton};
