// @flow

import Enzyme, {mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import {Provider} from 'react-redux';
import {reduxSetup} from 'redux-easy';

import SdModal from './sd-modal';

Enzyme.configure({adapter: new Adapter()});

describe('SdModal', () => {
  const message = 'some message';
  const title = 'Some Title';

  let store;

  function getJsx() {
    const initialState = {
      ui: {
        modal: {
          message,
          open: true,
          title
        }
      }
    };
    store = reduxSetup({initialState, mock: true});
    return (
      <Provider store={store}>
        <SdModal />
      </Provider>
    );
  }

  // We cannot write a snapshot test for this component
  // because modals are considered "portal" components
  // and snapshots do not work with those.
  test('handles click to close', () => {
    const wrapper = mount(getJsx());

    // Exercise the click handler added in componentDidMount.
    //TODO: Why doesn't this run the onclick function
    //TODO: that calls blur in sd-modal.js?
    const title = wrapper.find('.title').last();
    title.simulate('click');

    const checkbox = wrapper.find('.close').last();
    checkbox.simulate('click');
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.type).toBe('@@set');
    expect(action.payload).toEqual({
      path: 'ui.modal',
      value: {open: false}
    });
  });
});
