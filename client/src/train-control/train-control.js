// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Input} from 'redux-easy';
import Dial from '../dial/dial';

import type {StateType, TrainControlType} from '../types';

type PropsType = {
  trainControl: TrainControlType
};

class TrainControl extends Component<PropsType> {
  lightDial = () => {
    const rings = [
      {
        name: 'Light',
        min: 128,
        max: 256,
        color: '#AAA',
        iconUrl: 'images/light-off.png'
      },
      {
        name: 'Dark',
        min: 0,
        max: 128,
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
        value={this.props.trainControl.light}
      />
    );
  };

  powerDial = () => {
    const rings = [
      {
        name: 'Forward',
        min: 17,
        max: 100,
        color: '#00FF02',
        iconUrl: 'images/forward.png'
      },
      {
        name: 'Idle',
        min: -17,
        max: 17,
        color: '#FFFF02',
        iconUrl: 'images/idle.png'
      },
      {
        name: 'Reverse',
        min: -100,
        max: -17,
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
        value={this.props.trainControl.power}
      />
    );
  };

  render() {
    return (
      <div className="train-control">
        <div className="power">
          {this.powerDial()}
          <Input path="trainControl.power" type="range" min="-100" max="100" />
          <Input
            path="trainControl.idleCalibration"
            type="range"
            min="0"
            max="100"
          />
        </div>
        <div className="light">
          {this.lightDial()}
          <Input path="trainControl.light" type="range" min="0" max="256" />
          <Input
            path="trainControl.lightCalibration"
            type="range"
            min="0"
            max="256"
          />
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
