// @flow

// $FlowFixMe - Flow doesn't know about Fragment yet.
import React, {Component, Fragment} from 'react';

import {circle, fatArc, polarToCartesian, rect, text} from '../util/svg-util';

import './dial.css';

type PropsType = {
  max: number,
  min: number,
  iconUrl?: string,
  tickMajor: number,
  tickMinor: number,
  title: string,
  value: number
};

const BG_COLOR = '#536071';
const CENTER_COLOR = '#ABABAB';
const FORWARD_COLOR = '#00FF02';
const HEIGHT = 300;
const ICON_SIZE = 32;
const IDLE_COLOR = '#FFFF02';
const MAX_ANGLE = -60;
const MIN_ANGLE = 240;
const NEEDLE_LEFT_COLOR = '#B00A13';
const NEEDLE_LENGTH_PERCENT = 0.7;
const NEEDLE_RIGHT_COLOR = '#FC131E';
const RADIUS = 100;
const RING_WIDTH = 12;
const REVERSE_COLOR = '#F00';
const WIDTH = 400;
const CENTER = {x: WIDTH / 2, y: HEIGHT / 2};

function dialArc(label, color, start, end) {
  return fatArc({
    center: CENTER,
    innerRadius: RADIUS - RING_WIDTH,
    label,
    outerRadius: RADIUS,
    startAngle: start,
    endAngle: end,
    fill: color
  });
}

function tick(value, angle, isMajor) {
  console.log('dial.js tick: value =', value, 'angle =', angle);
  const r1 = RADIUS * 0.86;
  const r2 = RADIUS * (isMajor ? 0.78 : 0.83);
  const r3 = RADIUS * 0.7;
  const strokeWidth = 2; //isMajor ? 2 : 1;
  const p1 = polarToCartesian(CENTER, r1, angle);
  const p2 = polarToCartesian(CENTER, r2, angle);
  const p3 = polarToCartesian(CENTER, r3, angle);
  const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;

  const label = isMajor
    ? text({text: String(value), center: p3, dy: 3, fill: 'white', fontSize: 8})
    : null;

  return (
    <Fragment>
      <path
        key={`${isMajor ? 'major' : 'minor'}-tick-${angle}`}
        d={d}
        stroke="white"
        strokeWidth={strokeWidth}
      />
      {label}
    </Fragment>
  );
}

class Dial extends Component<PropsType> {
  anglePerValue = 0;

  dialNeedle = (value: number) => {
    const angle = this.valueToAngle(value);
    const radius = RADIUS * NEEDLE_LENGTH_PERCENT;
    const point = polarToCartesian(CENTER, radius, angle);
    const needleWidth = RADIUS * 0.07;
    const baseLeft = polarToCartesian(CENTER, needleWidth, angle + 90);
    const baseRight = polarToCartesian(CENTER, needleWidth, angle - 90);

    const leftNeedle = `
      M ${point.x} ${point.y}
      L ${baseLeft.x} ${baseLeft.y}
      L ${CENTER.x} ${CENTER.y}
      L ${point.x} ${point.y}
    `;
    const rightNeedle = `
      M ${point.x} ${point.y}
      L ${CENTER.x} ${CENTER.y}
      L ${baseRight.x} ${baseRight.y}
      L ${point.x} ${point.y}
    `;
    return (
      <Fragment>
        <path d={leftNeedle} fill={NEEDLE_LEFT_COLOR} />;
        <path d={rightNeedle} fill={NEEDLE_RIGHT_COLOR} />;
      </Fragment>
    );
  };

  tickMarks = () => {
    const {max, min, tickMajor, tickMinor} = this.props;
    const {anglePerValue} = this;

    const ticks = [];

    let value = min;
    while (value <= max) {
      const angle = MIN_ANGLE + (value - min) * anglePerValue;
      ticks.push(tick(value, angle, false));
      value += tickMinor;
    }

    value = min;
    while (value <= max) {
      const angle = MIN_ANGLE + (value - min) * anglePerValue;
      ticks.push(tick(value, angle, true));
      value += tickMajor;
    }

    return ticks;
  };

  valueToAngle = (value: number) =>
    MIN_ANGLE + (value - this.props.min) * this.anglePerValue;

  render() {
    const {iconUrl, max, min, title, value} = this.props;
    this.anglePerValue = (MAX_ANGLE - MIN_ANGLE) / (max - min);

    const calibrationAngle = 40;
    const idleMax = 90 - calibrationAngle / 2;
    const idleMin = 90 + calibrationAngle / 2;

    const icon = iconUrl ? (
      <image
        href={iconUrl}
        height={ICON_SIZE}
        x={CENTER.x - ICON_SIZE / 2}
        y={CENTER.y - RADIUS * 0.58}
      />
    ) : null;

    return (
      <svg width={WIDTH} height={HEIGHT}>
        <defs>
          <radialGradient id="rg">
            <stop offset="75%" stopColor={BG_COLOR} />
            <stop offset="100%" stopColor="#1C1B1C" />
          </radialGradient>
        </defs>

        {rect({x: 0, y: 0, width: WIDTH, height: HEIGHT})}
        {circle({
          className: 'dialBackground',
          center: CENTER,
          fill: 'url(#rg)',
          radius: RADIUS + 1,
          stroke: 'black',
          strokeWidth: 3
        })}
        {dialArc('Forward', FORWARD_COLOR, MAX_ANGLE, idleMax)}
        {dialArc('Idle', IDLE_COLOR, idleMax, idleMin)}
        {dialArc('Reverse', REVERSE_COLOR, idleMin, MIN_ANGLE)}
        {text({
          center: CENTER,
          dy: 28,
          fill: 'white',
          fontSize: 8,
          text: title
        })}
        {this.tickMarks()}
        {icon}
        {this.dialNeedle(value)}
        {circle({center: CENTER, fill: CENTER_COLOR, radius: 8})}
      </svg>
    );
  }
}

export default Dial;
