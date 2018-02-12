// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import Dial, {type RingType} from '../dial/dial';
import {send} from '../websocket';

import './train-control.css';

import type {StateType, TrainControlType} from '../types';

type PropsType = {
  mqttConnected: boolean,
  trainControl: TrainControlType
};

const lightOverrideMap = {
  Off: 0,
  On: 1,
  Auto: 2
};
const trainName = 'thejoveexpress';

function getButton(label: string, lightOverride: number) {
  const buttonValue = lightOverrideMap[label];
  const selected = buttonValue === lightOverride;
  const className = selected ? 'selected' : '';
  return <button className={className}>{label}</button>;
}

class TrainControl extends Component<PropsType> {
  counters = () => (
    <div className="counters">
      <div>1</div>
      <div>.</div>
      <div>-</div>
      <div>.</div>
      <div>-</div>
    </div>
  );

  handleBillboardChange = event => {
    dispatchSet('trainControl.billboardText', event.target.value);
  };

  lightDial = () => {
    const {
      detectedLight,
      detectedLightCalibration
    } = this.props.trainControl;

    const rings: RingType[] = [
      {
        className: 'light-light',
        name: 'Light',
        min: detectedLightCalibration,
        max: 256,
        iconUrl: 'images/light-off.png'
      },
      {
        className: 'light-dark',
        name: 'Dark',
        min: 0,
        max: detectedLightCalibration,
        iconUrl: 'images/light-on.png'
      }
    ];
    return (
      <Dial
        max={256}
        min={0}
        rings={rings}
        tickMajor={32}
        tickMinor={8}
        title="Lighting"
        value={detectedLight}
      />
    );
  };

  powerDial = () => {
    const {detectedIdleCalibration, detectedPower} = this.props.trainControl;

    const rings: RingType[] = [
      {
        className: 'power-forward',
        name: 'Forward',
        min: detectedIdleCalibration,
        max: 100,
        iconUrl: 'images/forward.png'
      },
      {
        className: 'power-idle',
        name: 'Idle',
        min: -detectedIdleCalibration,
        max: detectedIdleCalibration,
        iconUrl: 'images/idle.png'
      },
      {
        className: 'power-reverse',
        name: 'Reverse',
        min: -100,
        max: -detectedIdleCalibration,
        iconUrl: 'images/reverse.png'
      }
    ];
    return (
      <Dial
        max={100}
        min={-100}
        rings={rings}
        tickMajor={20}
        tickMinor={2}
        title="Power"
        value={detectedPower}
      />
    );
  };

  publish = (
    topic: string,
    property: string,
    event: SyntheticInputEvent<HTMLInputElement>
  ) => {
    const value = Number(event.target.value);

    //TODO: Include server id in message?
    let msg = `set ${trainName}/${topic}/control = ${value}`;
    const max = topic.startsWith('engine/')
      ? 100
      : topic.startsWith('lights/') ? 256 : 0;
    if (max) msg += ' ' + max;

    console.log('train-control.js publish: msg =', msg);
    send(msg);

    console.log('train-control.js publish: property =', property);
    console.log('train-control.js publish: value =', value);
    dispatchSet('trainControl.' + property, value);
  };

  render() {
    const {mqttConnected, trainControl} = this.props;
    console.log('train-control.js render: trainControl =', trainControl);
    const {controlledBillboardText, controlledLightOverride} = trainControl;

    const connImg = mqttConnected ? 'connected' : 'disconnected';

    return (
      <div className="train-control">
        <header>
          <div className="left">
            <img src="images/dead.png" alt="lifecycle" />
            <input
              className="billboard"
              type="text"
              onChange={this.handleBillboardChange}
              value={controlledBillboardText}
            />
          </div>
          <div className="right">
            {this.counters()}
            <img src={`images/${connImg}.png`} alt="broker connected" />
          </div>
        </header>
        <div className="power">
          {this.powerDial()}

          <input
            className="power-slider"
            type="range"
            min="-100"
            max="100"
            onChange={e => this.publish('engine/power', 'power', e)}
            value={trainControl.controlledPower}
          />
          <label>Power</label>

          <input
            type="range"
            min="0"
            max="100"
            onChange={e =>
              this.publish('engine/calibration', 'idleCalibration', e)
            }
            value={trainControl.controlledIdleCalibration}
          />
          <label>Calibrate Idle</label>
        </div>
        <div className="light">
          {this.lightDial()}

          {/*TODO: These aren't wired up yet. */}
          <div className="light-mode">
            {getButton('Off', controlledLightOverride)}
            {getButton('On', controlledLightOverride)}
            {getButton('Auto', controlledLightOverride)}
          </div>

          {/*
          <input
            type="range"
            min="0"
            max="256"
            onChange={e => this.publish('lights/ambient', 'light', e)}
            value={trainControl.light}
          />
          */}
          <label>Lights</label>

          <input
            type="range"
            min="0"
            max="256"
            onChange={e =>
              this.publish('lights/calibration', 'lightCalibration', e)
            }
            value={trainControl.controlledLightCalibration}
          />
          <label>Calibrate Ambient Light</label>
        </div>
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {mqttConnected, trainControl} = state;
  //TODO: Fix this to get real value of lightOverride.
  return {
    mqttConnected,
    trainControl: {...trainControl, lightOverride: 2}
  };
};

export default connect(mapState)(TrainControl);
