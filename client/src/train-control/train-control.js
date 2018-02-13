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
    const {value} = event.target;
    dispatchSet('trainControl.controlled.billboardText', value);
    this.publish('billboard', 'controlledBillboardText', event);
  };

  lightDial = () => {
    const {light, lightCalibration} = this.props.trainControl.detected;

    const rings: RingType[] = [
      {
        className: 'light-light',
        name: 'Light',
        min: lightCalibration,
        max: 256,
        iconUrl: 'images/light-off.png'
      },
      {
        className: 'light-dark',
        name: 'Dark',
        min: 0,
        max: lightCalibration,
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
        value={light}
      />
    );
  };

  powerDial = () => {
    const {idleCalibration, power} = this.props.trainControl.detected;

    const rings: RingType[] = [
      {
        className: 'power-forward',
        name: 'Forward',
        min: idleCalibration,
        max: 100,
        iconUrl: 'images/forward.png'
      },
      {
        className: 'power-idle',
        name: 'Idle',
        min: -idleCalibration,
        max: idleCalibration,
        iconUrl: 'images/idle.png'
      },
      {
        className: 'power-reverse',
        name: 'Reverse',
        min: -100,
        max: -idleCalibration,
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
        value={power}
      />
    );
  };

  publish = (
    topic: string,
    property: string,
    event: SyntheticInputEvent<HTMLInputElement>
  ) => {
    const {value} = event.target;

    //TODO: Include server id in message?
    let msg = `set ${trainName}/${topic}/control = ${value}`;
    const max = topic.startsWith('engine/')
      ? 100
      : topic.startsWith('lights/') ? 256 : 0;
    if (max) msg += ' ' + max;

    send(msg);

    const typedValue = topic === 'billboard' ? value : Number(value);
    dispatchSet('trainControl.' + property, typedValue);
  };

  render() {
    const {mqttConnected, trainControl} = this.props;
    const {
      billboardText,
      idleCalibration,
      lightCalibration,
      lightOverride,
      power
    } = trainControl.controlled;

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
              value={billboardText}
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
            onChange={e => this.publish('engine/power', 'controlled.power', e)}
            value={power}
          />
          <label>Power</label>

          <input
            type="range"
            min="0"
            max="100"
            onChange={e =>
              this.publish('engine/calibration', 'controlled.idleCalibration', e)
            }
            value={idleCalibration}
          />
          <label>Calibrate Idle</label>
        </div>
        <div className="light">
          {this.lightDial()}

          {/*TODO: These aren't wired up yet. */}
          <div className="light-mode">
            {getButton('Off', lightOverride)}
            {getButton('On', lightOverride)}
            {getButton('Auto', lightOverride)}
          </div>

          {/*
          <input
            type="range"
            min="0"
            max="256"
            onChange={e => this.publish('lights/ambient', 'controlled.light', e)}
            value={trainControl.light}
          />
          */}
          <label>Lights</label>

          <input
            type="range"
            min="0"
            max="256"
            onChange={e =>
              this.publish(
                'lights/calibration',
                'controlled.lightCalibration',
                e
              )
            }
            value={lightCalibration}
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
