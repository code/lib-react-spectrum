/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Content, Header} from '@react-spectrum/view';
import {InlineAlert} from '../';
import {Meta} from '@storybook/react';
import React from 'react';
import {SpectrumInlineAlertProps} from '@react-types/inlinealert';

type StoryArgs = SpectrumInlineAlertProps & {title: string, content: string};

const meta: Meta<StoryArgs> = {
  title: 'InlineAlert',
  component: InlineAlert,
  args: {
    title: 'Title',
    content: 'Content'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'info', 'positive', 'notice', 'negative']
    },
    title: {
      control: 'text'
    },
    content: {
      control: 'text'
    }
  }
};

export default meta;

export const Default = {
  render: (args) => (
    <InlineAlert {...args}>
      <Header>{args.title}</Header>
      <Content>{args.content}</Content>
    </InlineAlert>
  )
};

export const LongContent = {
  ...Default,
  args: {
    title: 'Unable to process payment',
    content: 'There was an error processing your payment. Please check your credit card information is correct, then try again.'
  }
};

export const InfoVariant = {
  ...Default,
  args: {
    variant: 'info'
  }
};
