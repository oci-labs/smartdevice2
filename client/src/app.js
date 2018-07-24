// @flow

import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import Enums from './enums/enums';
import Header from './header/header';
import InstanceDetail from './instance-detail/instance-detail';
import LeftNav from './left-nav/left-nav';
import MessageServers from './message-servers/message-servers';
import SdModal from './share/sd-modal';
import TrainControl from './train-control/train-control';
import TypeDefinitions from './type-definitions/type-definitions';
import UserDropdown from './user-dropdown/user-dropdown';
// import ReactChartkick, {LineChart, ColumnChart} from 'react-chartkick';
// import Chart from 'chart.js';
// import * as moment from 'moment';

import type {ViewType} from './types';

import './app.css';

type PropsType = {
  view: ViewType
};

const rightMap = {
  '': null,
  Enums: <Enums />,
  Instances: <InstanceDetail />,
  Servers: <MessageServers />,
  'Train Control': <TrainControl />,
  Types: <TypeDefinitions />
};

const hasLeftNav = view => view === 'Instances' || view === 'Types';

class App extends Component<PropsType> {
  handleClick = () => dispatchSet('ui.showUserDropdown', false);

  render() {
    const {view, instanceData, chartData} = this.props;
    // const instanceVal = instanceData.ambient;
    // const ambientVal = chartData ? chartData.ambient : null;
    // const now = moment().valueOf();
    // const data = [];
    // const millisecond = [];

    // for (const key in ambientVal) {
    //   if (ambientVal.hasOwnProperty(key)) {
    //     // console.log(key + ' -> ' + ambientVal[key]);
    //     millisecond.push(key);
    //     data.push(ambientVal[key]);
    //   }
    // }
    // for (let i = 0; i < millisecond.length; i++) {
    //   this['millisecond' + i] = millisecond[i];
    // }
    //
    // const objectTesting = {};
    // for (let j = 0; j < data.length; j++) {
    //   this['data' + j] = data[j];
    //   objectTesting[moment(Number(millisecond[j])).format('h:mm:ss')] = data[j];
    // }

    return (
      <div className="app" onClick={this.handleClick}>
        <Header />
        <UserDropdown />
        {/* <LineChart
          suffix="%"
          data={objectTesting}
          height="300px"
          width="500px"
          xtitle="Ambient Values"
          dataset={{pointStyle: 'dash', pointRadius: 1}}
        /> */}
        <section id="body">
          {hasLeftNav(view) && <LeftNav />}
          {rightMap[view]}
        </section>
        <SdModal />
      </div>
    );
  }
}

export default watch(App, {
  view: 'ui.view',
  instanceData: '',
  chartData: ''
});
