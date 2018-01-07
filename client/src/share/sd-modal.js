// @flow

import React, {Component} from 'react';
import Modal from 'react-modal'; // See https://reactcommunity.org/react-modal/.
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import './sd-modal.css';

import type {ModalType, StateType} from '../types';

type PropsType = ModalType & {render?: Function};

let renderFn;

export function hideModal(): void {
  renderFn = null;
  dispatch('setModal', {open: false});
}

export function showModal(
  title: string,
  message?: string,
  fn?: Function
): void {
  if (fn) renderFn = fn;
  // Using a setTimeout allows this to be called from a reducer.
  setTimeout(() => {
    dispatch('setModal', {open: true, message, title});
  });
}

class SdModal extends Component<PropsType> {
  modal: ?Object = null;

  // This prevents the modal from gaining focus
  // which would cause it to have a light blue outline.
  componentDidMount() {
    // istanbul ignore next
    if (!this.modal) return; // this should never happen
    const {node} = this.modal;
    //TODO: I can't find a way to get test coverage for this.
    node.onclick = () => node.firstChild.firstChild.blur();
  }

  onCloseModal = () => dispatch('setModal', {open: false});

  render() {
    const {message, open, title} = this.props;
    return (
      <Modal
        ariaHideApp={false}
        className="sd-modal"
        isOpen={open}
        onRequestClose={this.onCloseModal}
        ref={modal => (this.modal = modal)}
        shouldCloseOnOverlayClick={false}
        shouldFocusAfterRender={false}
      >
        <header>
          <div className="title">{title}</div>
          <div className="close" onClick={this.onCloseModal}>
            &#10005;
          </div>
        </header>
        <section className="body">
          {message ? <p>{message}</p> : null}
          {renderFn ? renderFn() : null}
        </section>
      </Modal>
    );
  }
}

const mapState = (state: StateType): ModalType => {
  const {ui: {modal}} = state;
  return modal;
};

export default connect(mapState)(SdModal);
