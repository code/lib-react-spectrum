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

import {Button, Checkbox, CheckboxGroup, Form, Radio, RadioGroup, RangeSlider, SearchField, Slider, Switch, TextArea, TextField} from '../src';
import {categorizeArgTypes} from './utils';
import type {Meta} from '@storybook/react';
import {style} from '../style/spectrum-theme' with {type: 'macro'};

const meta: Meta<typeof Form> = {
  component: Form,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    ...categorizeArgTypes('Events', ['onInvalid', 'onReset', 'onSubmit'])
  }
};

export default meta;

export const Example = (args: any) => (
  <Form {...args}>
    <TextField label="First Name" name="firstName" />
    <TextField label="Last Name" name="firstName" />
    <TextField label="Email" name="email" type="email" description="Enter an email" />
    <CheckboxGroup label="Favorite sports">
      <Checkbox value="soccer">Soccer</Checkbox>
      <Checkbox value="baseball">Baseball</Checkbox>
      <Checkbox value="basketball">Basketball</Checkbox>
    </CheckboxGroup>
    <RadioGroup label="Favorite pet">
      <Radio value="cat">Cat</Radio>
      <Radio value="dog">Dog</Radio>
      <Radio value="plant" isDisabled>Plant</Radio>
    </RadioGroup>
    <TextField label="City" name="city" description="A long description to test help text wrapping." />
    <TextField label="A long label to test wrapping behavior" name="long" />
    <SearchField label="Search" name="search" />
    <TextArea label="Comment" name="comment" />
    <Switch>Wi-Fi</Switch>
    <Checkbox>I agree to the terms</Checkbox>
    <Slider label="Cookies"  defaultValue={30} />
    <RangeSlider label="Range"  defaultValue={{start: 30, end: 60}} />
    <Button type="submit" variant="primary" styles={style({gridColumnStart: 'field', width: 'fit'})}>Submit</Button>
  </Form>
);
