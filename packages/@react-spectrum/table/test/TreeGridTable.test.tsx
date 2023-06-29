/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

jest.mock('@react-aria/live-announcer');
import {act, fireEvent, installPointerEvent, render as renderComponent, triggerPress, within} from '@react-spectrum/test-utils';
import {announce} from '@react-aria/live-announcer';
import {composeStories} from '@storybook/testing-react';
import {enableTableNestedRows} from '@react-stately/flags';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {Scale} from '@react-types/provider';
import * as stories from '../stories/TreeGridTable.stories';
import {theme} from '@react-spectrum/theme-default';
import userEvent from '@testing-library/user-event';

// Importing this stuff made Table test run along side this test even when only this test suite is targeted
// import {getCell, render, rerender} from './Table.test';
// TODO run along Table test suite with the flag turned on to make sure nothing breaks, see unavailable menu items test

let {
  StaticExpandableRows: StaticExpandableTable,
  DynamicExpandableRowsStory: DynamicExpandableTable,
  ManyExpandableRowsStory: ManyRowsExpandableTable,
  EmptyTreeGridStory: EmptyStateTable,
  LoadingTreeGridStory: LoadingTable
} = composeStories(stories);

let onSelectionChange = jest.fn();
let onAction = jest.fn();

// function pointerEvent(type, opts) {
//   let evt = new Event(type, {bubbles: true, cancelable: true});
//   Object.assign(evt, {
//     ctrlKey: false,
//     metaKey: false,
//     shiftKey: false,
//     altKey: false,
//     button: opts.button || 0,
//     width: 1,
//     height: 1
//   }, opts);
//   return evt;
// }

let getCell = (tree, text) => {
  // Find by text, then go up to the element with the cell role.
  let el = tree.getByText(text);
  while (el && !/gridcell|rowheader|columnheader/.test(el.getAttribute('role'))) {
    el = el.parentElement;
  }

  return el;
};

let render = (children, scale = 'medium' as Scale, locale = 'en-US') => {
  enableTableNestedRows();
  let tree = renderComponent(
    <Provider theme={theme} scale={scale} locale={locale}>
      {children}
    </Provider>
  );

  act(() => {jest.runAllTimers();});
  return tree;
};

let rerender = (tree, children, scale = 'medium' as Scale) => {
  let newTree = tree.rerender(
    <Provider theme={theme} scale={scale}>
      {children}
    </Provider>
  );
  act(() => {jest.runAllTimers();});
  return newTree;
};

describe('TableView with expandable rows', function () {
  beforeAll(function () {
    enableTableNestedRows();
    jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
    jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    act(() => {jest.runAllTimers();});
  });

  afterAll(function () {
    jest.restoreAllMocks();
  });

  it.each`
    Name                 | Component
    ${'static'}          | ${StaticExpandableTable}
    ${'dynamic'}         | ${DynamicExpandableTable}
  `('renders a $Name expandable rows table', ({Component}) => {
    let {getByRole} = render(<Component expandedKeys="all" />);

    let treegrid = getByRole('treegrid');
    expect(treegrid).toBeVisible();

    expect(treegrid).toHaveAttribute('aria-rowcount', '5');
    expect(treegrid).toHaveAttribute('aria-colcount', '3');

    let rowgroups = within(treegrid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headerRows = within(rowgroups[0]).getAllByRole('row');
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0]).not.toHaveAttribute('aria-rowindex');

    let headers = within(treegrid).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');

    for (let header of headers) {
      expect(header).not.toHaveAttribute('aria-sort');
      expect(header).not.toHaveAttribute('aria-describedby');
    }

    expect(headers[0]).toHaveTextContent('Foo');
    expect(headers[1]).toHaveTextContent('Bar');
    expect(headers[2]).toHaveTextContent('Baz');

    // First row
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
    let row = rows[0];
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-level', '1');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '1');
    expect(row).not.toHaveAttribute('aria-rowindex');

    let rowheader = within(row).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Lvl 1 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 1 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    let cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // first child Row
    row = rows[1];
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '2');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // child of child Row
    row = rows[2];
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).toHaveAttribute('aria-level', '3');
    expect(row).toHaveAttribute('aria-posinset', '1');
    expect(row).toHaveAttribute('aria-setsize', '1');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 3 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 3 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');

    // 2nd child Row of original top level row
    row = rows[3];
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).toHaveAttribute('aria-level', '2');
    expect(row).toHaveAttribute('aria-posinset', '2');
    expect(row).toHaveAttribute('aria-setsize', '2');
    expect(row).not.toHaveAttribute('aria-rowindex');

    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 2');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '1');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('aria-colindex', '2');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
  });

  it.each`
    Name                 | Component
    ${'static'}          | ${StaticExpandableTable}
    ${'dynamic'}         | ${DynamicExpandableTable}
  `('renders a $Name expandable rows table with selection', ({Component}) => {
    let {getByRole} = render(<Component expandedKeys="all" selectionMode="multiple" />);

    let treegrid = getByRole('treegrid');
    expect(treegrid).toHaveAttribute('aria-multiselectable', 'true');
    expect(treegrid).toHaveAttribute('aria-colcount', '4');

    let rowgroups = within(treegrid).getAllByRole('rowgroup');
    expect(rowgroups).toHaveLength(2);

    let headers = within(treegrid).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveAttribute('aria-colindex', '1');
    expect(headers[1]).toHaveAttribute('aria-colindex', '2');
    expect(headers[2]).toHaveAttribute('aria-colindex', '3');
    expect(headers[3]).toHaveAttribute('aria-colindex', '4');

    let checkbox = within(headers[0]).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select All');

    // First row
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
    let row = rows[0];

    let rowheader = within(row).getByRole('rowheader');
    let cellSpan = within(rowheader).getByText('Lvl 1 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 1 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    let cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // first child Row
    row = rows[1];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select');
    expect(checkbox).toHaveAttribute('aria-labelledby', `${checkbox.id} ${cellSpan.id}`);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // child of child Row
    row = rows[2];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 3 Foo 1');
    expect(rowheader).toHaveTextContent('Lvl 3 Foo 1');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');

    // 2nd child Row of original top level row
    row = rows[3];
    rowheader = within(row).getByRole('rowheader');
    cellSpan = within(rowheader).getByText('Lvl 2 Foo 2');
    expect(rowheader).toHaveTextContent('Lvl 2 Foo 2');
    expect(rowheader).toHaveAttribute('aria-colindex', '2');
    expect(row).toHaveAttribute('aria-labelledby', cellSpan.id);

    cells = within(row).getAllByRole('gridcell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[1]).toHaveAttribute('aria-colindex', '3');
    expect(cells[2]).toHaveAttribute('aria-colindex', '4');
  });

  it('shouldn\'t render a child row if its parent isn\'t included in the expanded keys', function () {
    let treegrid = render(<DynamicExpandableTable expandedKeys={['Lvl 2 Foo 1']} />);
    let rowgroups = treegrid.getAllByRole('rowgroup');
    let rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContainElement(getCell(treegrid, 'Lvl 1 Foo 1'));
    rerender(treegrid, <DynamicExpandableTable expandedKeys={['Lvl 2 Foo 1', 'Lvl 1 Foo 1']} />);
    rowgroups = treegrid.getAllByRole('rowgroup');
    rows = within(rowgroups[1]).getAllByRole('row');
    expect(rows).toHaveLength(4);
  });

  describe('keyboard focus', function () {
    let focusCell = (tree, text) => act(() => getCell(tree, text).focus());
    let moveFocus = (key, opts = {}) => {
      fireEvent.keyDown(document.activeElement, {key, ...opts});
      fireEvent.keyUp(document.activeElement, {key, ...opts});
    };

    describe('ArrowDown', function () {
      it('should move focus to the nested row\'s below', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
      });

      it('should move focus to the nested row\'s cell below', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        focusCell(treegrid, 'Row 1, Lvl 1, Foo');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
      });

      it('should move focus to the cell below a column header', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        focusCell(treegrid, 'Bar');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 1, Bar'));
      });

      it('should allow the user to focus disabled nested rows', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" disabledKeys={['Row 1 Lvl 2']} />);
        focusCell(treegrid, 'Row 1, Lvl 1, Foo');
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should skip child rows of non-expanded parent rows', function () {
        // Only one child level of Row 1 and Row 3 should be exposed, otherwise only the top level rows are rendered
        let treegrid = render(<ManyRowsExpandableTable expandedKeys={['Row 1 Lvl 1', 'Row 3 Lvl 1']} />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
        moveFocus('ArrowDown');
        expect(document.activeElement).toBe(rows[5]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 2, Foo'));
      });
    });

    describe('ArrowUp', function () {
      it('should move focus to the nested row\'s above', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[4].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[1]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
      });

      it('should move focus to the nested row\'s cell above', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        focusCell(treegrid, 'Row 2, Lvl 1, Foo');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
      });

      it('should move focus to the column header above a cell in the first row ', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        focusCell(treegrid, 'Row 1, Lvl 1, Bar');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Bar'));
      });

      it('should move focus to the column header above the first row', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[1].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Foo'));
      });

      it('should allow the user to focus disabled nested rows', function () {
        let treegrid = render(<ManyRowsExpandableTable expandedKeys="all" disabledKeys={['Row 1 Lvl 2']} />);
        focusCell(treegrid, 'Row 1, Lvl 3, Foo');
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should skip child rows of non-expanded parent rows', function () {
        // Only one child level of Row 1 and Row 3 should be exposed, otherwise only the top level rows are rendered
        let treegrid = render(<ManyRowsExpandableTable expandedKeys={['Row 1 Lvl 1', 'Row 3 Lvl 1']} />);
        let rows = treegrid.getAllByRole('row');
        act(() => {rows[5].focus();});
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[4]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[3]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
        moveFocus('ArrowUp');
        expect(document.activeElement).toBe(rows[2]);
        expect(document.activeElement).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });

    describe('ArrowRight', function () {
      it('should properly wrap focus with ArrowRight', function () {
        let treegrid = render(<ManyRowsExpandableTable />);
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should properly wrap focus with ArrowRight (RTL)', function () {
        let treegrid = render(<ManyRowsExpandableTable />, undefined, 'ar-AE');
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        // Focus doesn't move because Arrow Right on the row will collapse it
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(row);
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowRight');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });

    describe('ArrowLeft', function () {
      it('should properly wrap focus with ArrowLeft', function () {
        let treegrid = render(<ManyRowsExpandableTable />);
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        // Focus doesn't move because Arrow Left on the row will collapse it here
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });

      it('should properly wrap focus with ArrowLeft (RTL)', function () {
        let treegrid = render(<ManyRowsExpandableTable />, undefined, 'ar-AE');
        let row = treegrid.getAllByRole('row')[2];
        focusCell(treegrid, 'Row 1, Lvl 2, Foo');
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Bar'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Baz'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(row);
        expect(row).toContainElement(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
        moveFocus('ArrowLeft');
        expect(document.activeElement).toBe(getCell(treegrid, 'Row 1, Lvl 2, Foo'));
      });
    });
    // TODO add End/Home/PageUp/Down and check that it can land on a nested row

    // Test that type to select works with nested rows
  });

  describe('selection', function () {
    let checkSelection = (onSelectionChange, selectedKeys) => {
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(selectedKeys));
    };

    let checkSelectAll = (tree, state = 'indeterminate') => {
      let checkbox = tree.getByLabelText('Select All');
      if (state === 'indeterminate') {
        expect(checkbox.indeterminate).toBe(true);
      } else {
        expect(checkbox.checked).toBe(state === 'checked');
      }
    };

    let checkRowSelection = (rows, selected) => {
      for (let row of rows) {
        expect(row).toHaveAttribute('aria-selected', '' + selected);
      }
    };

    let pressWithKeyboard = (element, key = ' ') => {
      fireEvent.keyDown(element, {key});
      act(() => {element.focus();});
      fireEvent.keyUp(element, {key});
    };

    describe('row selection', function () {
      describe('with pointer', function () {
        it('should select a row when clicking on the chevron cell', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let chevronCell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
          let chevron = within(chevronCell).getByRole('button');
          expect(chevron).toHaveAttribute('aria-label', 'Collapse');

          checkRowSelection(rows, false);
          triggerPress(chevronCell);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);

          onSelectionChange.mockReset();
          triggerPress(chevron);
          expect(onSelectionChange).not.toHaveBeenCalled();
          checkRowSelection(rows.slice(0, 1), true);
        });

        it('should select a nested row on click', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

          checkRowSelection(rows, false);
          triggerPress(cell);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(2, 3), true);
        });
      });

      describe('with keyboard', function () {
        it('should select a nested row by pressing the Enter key on a row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(rows[1], 'Enter');
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 2'
          ]);
          checkRowSelection(rows.slice(1, 2), true);
          checkSelectAll(treegrid);
        });

        it('should select a nested row by pressing the Space key on a row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(rows[1]);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 2'
          ]);
          checkRowSelection(rows.slice(1, 2), true);
          checkSelectAll(treegrid);
        });

        it('should select a row by pressing the Enter key on a chevron cell', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');


          checkRowSelection(rows, false);
          pressWithKeyboard(cell, 'Enter');
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkSelectAll(treegrid);
        });

        it('should select a row by pressing the Space key on a chevron cell', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');
          let cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');


          checkRowSelection(rows, false);
          pressWithKeyboard(cell);
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkSelectAll(treegrid);
        });
      });
    });

    describe('range selection', function () {
      describe('with pointer', function () {
        it('should support selecting a range from a top level row to a nested row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          triggerPress(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          triggerPress(getCell(treegrid, 'Row 2, Lvl 3, Foo'), {shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 6), true);
          checkRowSelection(rows.slice(6), false);
        });

        it('should support selecting a range from a nested row to a top level row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          triggerPress(getCell(treegrid, 'Row 2, Lvl 3, Foo'));
          onSelectionChange.mockReset();

          triggerPress(getCell(treegrid, 'Row 1, Lvl 1, Foo'), {shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 6), true);
          checkRowSelection(rows.slice(6), false);
        });

        it('should support selecting a range from a top level row to a descendent child row', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          triggerPress(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          triggerPress(getCell(treegrid, 'Row 1, Lvl 3, Foo'), {shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 3), true);
          checkRowSelection(rows.slice(3), false);
        });

        it('should support selecting a range from a nested child row to its top level row ancestor', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          triggerPress(getCell(treegrid, 'Row 1, Lvl 3, Foo'));
          onSelectionChange.mockReset();

          triggerPress(getCell(treegrid, 'Row 1, Lvl 1, Foo'), {shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 3), true);
          checkRowSelection(rows.slice(3), false);
        });

        it('should not include disabled rows', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={['Row 1 Lvl 2']} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          triggerPress(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          triggerPress(getCell(treegrid, 'Row 2, Lvl 3, Foo'), {shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3'
          ]);
          checkRowSelection(rows.slice(0, 1), true);
          checkRowSelection(rows.slice(1, 2), false);
          checkRowSelection(rows.slice(2, 6), true);
        });
      });

      describe('with keyboard', function () {
        it('should extend a selection with Shift + ArrowDown through nested keys', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2'
          ]);

          onSelectionChange.mockReset();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3'
          ]);

          onSelectionChange.mockReset();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 4), true);
          checkRowSelection(rows.slice(4), false);
        });

        it('should extend a selection with Shift + ArrowUp through nested keys', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 2, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3'
          ]);

          onSelectionChange.mockReset();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3', 'Row 1 Lvl 2'
          ]);

          onSelectionChange.mockReset();
          fireEvent.keyDown(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowUp', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 2 Lvl 1', 'Row 1 Lvl 3', 'Row 1 Lvl 2', 'Row 1 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 4), true);
          checkRowSelection(rows.slice(4), false);
        });

        it('should extend a selection with Ctrl + Shift + Home', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'Home', shiftKey: true, ctrlKey: true});

          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3', 'Row 3 Lvl 1'
          ]);

          checkRowSelection(rows.slice(0, 7), true);
          checkRowSelection(rows.slice(7), false);
        });

        it('should extend a selection with Ctrl + Shift + End', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'End', shiftKey: true, ctrlKey: true});

          checkRowSelection(rows.slice(6), true);
        });

        it('should extend a selection with Shift + PageDown', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'PageDown', shiftKey: true});

          checkSelection(onSelectionChange, [
            'Row 3 Lvl 1', 'Row 3 Lvl 2', 'Row 3 Lvl 3', 'Row 4 Lvl 1', 'Row 4 Lvl 2', 'Row 4 Lvl 3',
            'Row 5 Lvl 1', 'Row 5 Lvl 2', 'Row 5 Lvl 3', 'Row 6 Lvl 1', 'Row 6 Lvl 2', 'Row 6 Lvl 3',
            'Row 7 Lvl 1', 'Row 7 Lvl 2', 'Row 7 Lvl 3', 'Row 8 Lvl 1', 'Row 8 Lvl 2', 'Row 8 Lvl 3',
            'Row 9 Lvl 1', 'Row 9 Lvl 2', 'Row 9 Lvl 3', 'Row 10 Lvl 1', 'Row 10 Lvl 2', 'Row 10 Lvl 3',
            'Row 11 Lvl 1'
          ]);
        });

        it('should extend a selection with Shift + PageUp', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 3, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'PageUp', shiftKey: true});

          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 2', 'Row 1 Lvl 3', 'Row 2 Lvl 1', 'Row 2 Lvl 2', 'Row 2 Lvl 3', 'Row 3 Lvl 1'
          ]);
        });

        it('should not include disabled rows', function () {
          let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={['Row 1 Lvl 2']} onAction={null} />);
          let rowgroups = treegrid.getAllByRole('rowgroup');
          let rows = within(rowgroups[1]).getAllByRole('row');

          checkRowSelection(rows, false);
          pressWithKeyboard(getCell(treegrid, 'Row 1, Lvl 1, Foo'));
          onSelectionChange.mockReset();

          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyDown(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          fireEvent.keyUp(document.activeElement, {key: 'ArrowDown', shiftKey: true});
          checkSelection(onSelectionChange, [
            'Row 1 Lvl 1', 'Row 1 Lvl 3'
          ]);

          checkRowSelection(rows.slice(0, 1), true);
          checkRowSelection(rows.slice(1, 2), false);
          checkRowSelection(rows.slice(2, 3), true);
        });
      });
    });

    describe('onAction', function () {
      installPointerEvent();

      it.each`
        Name
        ${'mouse'}
        ${'touch'}
      `('should trigger onAction when clicking nested rows with $Name', ({Name}) => {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={onAction} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');
        // TODO: Not sure why this is complaining about the type...
        // @ts-ignore
        userEvent.click(cell, {pointerType: Name});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Row 1 Lvl 3');
        checkRowSelection([rows[2]], false);

        let checkbox = within(rows[0]).getByRole('checkbox');
        userEvent.click(checkbox);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1']);
        checkRowSelection([rows[0]], true);
        onSelectionChange.mockReset();

        // @ts-ignore
        userEvent.click(cell, {pointerType: Name});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);
      });

      it('should trigger onAction when pressing Enter', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="checkbox" disabledKeys={null} onAction={onAction} />);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        fireEvent.keyDown(cell, {key: 'Enter'});
        fireEvent.keyUp(cell, {key: 'Enter'});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenLastCalledWith('Row 1 Lvl 3');
        checkRowSelection(rows, false);

        onAction.mockReset();
        fireEvent.keyDown(cell, {key: ' '});
        fireEvent.keyUp(cell, {key: ' '});
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onAction).not.toHaveBeenCalled();
        checkRowSelection([rows[2]], true);
      });
    });

    describe('selectionStyle highlight', function () {
      installPointerEvent();

      it('should toggle selection with mouse', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={null} onAction={null} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        // @ts-ignore
        userEvent.click(cell, {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        onSelectionChange.mockReset();

        cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
        // @ts-ignore
        userEvent.click(cell, {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 1, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1']);
        checkRowSelection([rows[0]], true);
        checkRowSelection(rows.slice(1), false);
      });

      it('should toggle selection with touch', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={null} onAction={null} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        // @ts-ignore
        userEvent.click(cell, {pointerType: 'touch'});
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        onSelectionChange.mockReset();

        cell = getCell(treegrid, 'Row 1, Lvl 1, Foo');
        // @ts-ignore
        userEvent.click(cell, {pointerType: 'touch'});
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 1, Foo selected. 2 items selected.');
        expect(announce).toHaveBeenCalledTimes(2);
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);
      });

      it('should support long press to enter selection mode on touch', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={null} onAction={onAction} />);
        userEvent.click(document.body);
        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let firstCell = getCell(treegrid, 'Row 1, Lvl 3, Foo');
        let secondCell = getCell(treegrid, 'Row 1, Lvl 1, Foo');

        fireEvent.pointerDown(firstCell, {pointerType: 'touch'});
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(800));

        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        checkRowSelection([rows[2]], true);
        expect(onAction).not.toHaveBeenCalled();

        fireEvent.pointerUp(firstCell, {pointerType: 'touch'});
        onSelectionChange.mockReset();

        // @ts-ignore
        userEvent.click(secondCell, {pointerType: 'touch'});
        checkSelection(onSelectionChange, ['Row 1 Lvl 1', 'Row 1 Lvl 3']);
        checkRowSelection([rows[0], rows[2]], true);

        // Deselect all to exit selection mode
        // @ts-ignore
        userEvent.click(firstCell, {pointerType: 'touch'});
        onSelectionChange.mockReset();
        // @ts-ignore
        userEvent.click(secondCell, {pointerType: 'touch'});

        act(() => jest.runAllTimers());
        checkSelection(onSelectionChange, []);
        expect(onAction).not.toHaveBeenCalled();
        checkRowSelection(rows, false);
      });

      it('should support double click to perform onAction with mouse', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={null} onAction={onAction} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();

        let rowgroups = treegrid.getAllByRole('rowgroup');
        let rows = within(rowgroups[1]).getAllByRole('row');
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        checkRowSelection(rows, false);
        // @ts-ignore
        userEvent.click(cell, {pointerType: 'mouse'});
        expect(announce).toHaveBeenLastCalledWith('Row 1, Lvl 3, Foo selected.');
        expect(announce).toHaveBeenCalledTimes(1);
        checkSelection(onSelectionChange, ['Row 1 Lvl 3']);
        expect(onAction).not.toHaveBeenCalled();
        onSelectionChange.mockReset();
        // @ts-ignore
        userEvent.dblClick(cell, {pointerType: 'mouse'});
        expect(announce).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Row 1 Lvl 3');
      });

      it('should support single tap to perform onAction with touch', function () {
        let treegrid = render(<ManyRowsExpandableTable onSelectionChange={onSelectionChange} selectionMode="multiple" selectionStyle="highlight" disabledKeys={null} onAction={onAction} />);
        expect(treegrid.queryByLabelText('Select All')).toBeNull();
        let cell = getCell(treegrid, 'Row 1, Lvl 3, Foo');

        // @ts-ignore
        userEvent.click(cell, {pointerType: 'touch'});
        expect(announce).not.toHaveBeenCalled();
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('Row 1 Lvl 3');
      });
    });
  });

  describe('empty state', function () {
    it('should display an empty state with the proper aria attributes', async function () {
      let treegrid = render(<EmptyStateTable />);
      await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings
      let rowgroups = treegrid.getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      let row = rows[0];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
      expect(row).toHaveAttribute('aria-setsize', '1');

      let cell = within(rows[0]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '3');

      let heading = within(cell).getByRole('heading');
      expect(heading).toBeVisible();
      expect(heading).toHaveTextContent('No results');

      let showItemsButton = treegrid.getAllByRole('button')[0];
      triggerPress(showItemsButton);
      act(() => jest.runAllTimers());
      rowgroups = treegrid.getAllByRole('rowgroup');
      rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(19);
      expect(heading).not.toBeInTheDocument();
    });
  });

  describe('loading state', function () {
    it('should render a spinner row with the proper attributes when loading', async function () {
      let treegrid = render(<LoadingTable />);
      await act(() => Promise.resolve()); // wait for MutationObserver in useHasTabbableChild or we get act warnings
      let rowgroups = treegrid.getAllByRole('rowgroup');
      let rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(1);
      let row = rows[0];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
      expect(row).toHaveAttribute('aria-setsize', '1');

      let cell = within(rows[0]).getByRole('rowheader');
      expect(cell).toHaveAttribute('aria-colspan', '3');

      let spinner = within(cell).getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', 'Loading…');
      expect(spinner).not.toHaveAttribute('aria-valuenow');

      let showItemsButton = treegrid.getAllByRole('button')[0];
      triggerPress(showItemsButton);
      act(() => jest.runAllTimers());
      rowgroups = treegrid.getAllByRole('rowgroup');
      rows = within(rowgroups[1]).getAllByRole('row');
      expect(rows).toHaveLength(20);

      row = rows[19];
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).toHaveAttribute('aria-level', '1');
      expect(row).toHaveAttribute('aria-posinset', '20');
      expect(row).toHaveAttribute('aria-setsize', '20');
      spinner = within(row).getByRole('progressbar');
      expect(spinner).toBeTruthy();
    });
  });

  // TODO: write tests for the following
  // selection (selected when all selection checkbox is pressed)
  // expanding/collapsing table (pointer/touch), check the aria values set (wait for interactions to be finalized to make testing that easier)
  // persisted keys
  // keyboard interaction (page up/down, home, end)
  // calculated aria attributes update when rows are expanded/collapsed
});