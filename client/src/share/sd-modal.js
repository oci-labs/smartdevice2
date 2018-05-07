// @flow

import React, {Component} from 'react';
import Modal from 'react-modal'; // See https://reactcommunity.org/react-modal/.
import {dispatchSet, Input, watch} from 'redux-easy';

import './sd-modal.css';

import type {ConfirmType, ModalType, PromptType} from '../types';

type PropsType = {
  modal: ModalType
};

let renderFn: ?Function;

export function hideModal(): void {
  renderFn = null;
  dispatchSet('ui.modal', {open: false});
}

export function showConfirm(options: ConfirmType): void {
  const {message, noCb, title, yesCb} = options;

  const handleYes = () => {
    hideModal();
    yesCb();
  };

  const handleNo = () => {
    hideModal();
    noCb();
  };

  renderFn = () => (
    <div className="button-row">
      <button className="button" onClick={handleYes}>Yes</button>
      <button className="button" onClick={handleNo}>No</button>
    </div>
  );

  // Using a setTimeout allows this to be called from a reducer.
  setTimeout(() => {
    dispatchSet('ui.modal', {open: true, message, renderFn, title});
  });
}

export function showModal(options: ModalType): void {
  const {error, message, renderFn: fn, title} = options;
  if (fn) renderFn = fn;

  // Using a setTimeout allows this to be called from a reducer.
  setTimeout(() => {
    dispatchSet('ui.modal', {error, open: true, message, title});
  });
}

export function showPrompt(options: PromptType): void {
  const {buttonText, label, message, okCb, path, title} = options;

  const handleOk = () => {
    hideModal();
    okCb();
  };

  renderFn = () => (
    <div>
      <div>
        <label>{label}</label>
        <Input autoFocus onEnter={handleOk} path={path} />
      </div>
      <div className="button-row">
        <button className="button" onClick={handleOk}>
          {buttonText}
        </button>
      </div>
    </div>
  );

  // Using a setTimeout allows this to be called from a reducer.
  setTimeout(() => {
    dispatchSet('ui.modal', {open: true, message, renderFn, title});
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

  onCloseModal = hideModal;

  renderMessage = () => {
    const {message} = this.props.modal;
    if (!message) return null;

    // If message contains newlines, honor them.
    const lines = message.split('\n');
    const line1 = lines.shift();
    return (
      <p>
        {line1}
        {lines.map((line, index) => [<br key={index} />, line])}
      </p>
    );
  };

  render() {
    const {error, message, open, title} = this.props.modal;
    let className = 'sd-modal';
    if (error) className += ' error';
    return (
      <Modal
        ariaHideApp={false}
        className={className}
        isOpen={open}
        onRequestClose={this.onCloseModal}
        ref={modal => (this.modal = modal)}
        shouldCloseOnOverlayClick={false}
      >
        <header>
          <div className="title">{title}</div>
          <div className="close" onClick={this.onCloseModal}>
            &#10005;
          </div>
        </header>
        <section className="body">
          {message ? this.renderMessage() : null}
          {renderFn ? renderFn() : null}
        </section>
      </Modal>
    );
  }
}

export default watch(SdModal, {modal: 'ui.modal'});
