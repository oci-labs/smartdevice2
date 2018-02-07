// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Input} from 'redux-easy';
import Dial, {type RingType} from '../dial/dial';

import './train-control.css';

import type {StateType, TrainControlType} from '../types';

type PropsType = {
  mqttConnected: boolean,
  trainControl: TrainControlType
};

class TrainControl extends Component<PropsType> {
  lightDial = () => {
    const {light, lightCalibration} = this.props.trainControl;

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
    const {idleCalibration, power} = this.props.trainControl;

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

  render() {
    const {mqttConnected} = this.props;
    const connImg = mqttConnected ? 'connected' : 'disconnected';

    return (
      <div className="train-control">
        <header>
          <img src="images/dead.png" alt="lifecycle" />
          <img src={`images/${connImg}.png`} alt="broker connected" />
        </header>
        <div className="power">
          {this.powerDial()}
          <Input path="trainControl.power" type="range" min="-100" max="100" />
          <label>Power</label>
          <Input
            path="trainControl.idleCalibration"
            type="range"
            min="0"
            max="100"
          />
          <label>Calibrate Idle</label>
        </div>
        <div className="light">
          {this.lightDial()}
          <Input path="trainControl.light" type="range" min="0" max="256" />
          <label>Lights</label>
          <Input
            path="trainControl.lightCalibration"
            type="range"
            min="0"
            max="256"
          />
          <label>Calibrate Ambient Light</label>
        </div>
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {mqttConnected, trainControl} = state;
  return {mqttConnected, trainControl};
};

export default connect(mapState)(TrainControl);
