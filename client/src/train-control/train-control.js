// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Input} from 'redux-easy';
import Dial from '../dial/dial';

import './train-control.css';

import type {StateType, TrainControlType} from '../types';

type PropsType = {
  trainControl: TrainControlType
};

class TrainControl extends Component<PropsType> {
  lightDial = () => {
    const {light, lightCalibration} = this.props.trainControl;

    const rings = [
      {
        name: 'Light',
        min: lightCalibration,
        max: 256,
        color: '#AAA',
        iconUrl: 'images/light-off.png'
      },
      {
        name: 'Dark',
        min: 0,
        max: lightCalibration,
        color: '#555',
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

    const rings = [
      {
        name: 'Forward',
        min: idleCalibration,
        max: 100,
        color: '#00FF02',
        iconUrl: 'images/forward.png'
      },
      {
        name: 'Idle',
        min: -idleCalibration,
        max: idleCalibration,
        color: '#FFFF02',
        iconUrl: 'images/idle.png'
      },
      {
        name: 'Reverse',
        min: -100,
        max: -idleCalibration,
        color: '#F00',
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
    return (
      <div className="train-control">
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
  const {trainControl} = state;
  return {trainControl};
};

export default connect(mapState)(TrainControl);
