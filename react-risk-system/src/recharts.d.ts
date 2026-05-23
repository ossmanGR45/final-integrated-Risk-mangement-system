// recharts.d.ts — Fix recharts + React 19 JSX return-type incompatibility.
// recharts types declare component return as ReactNode, but React 19 expects
// Element | null. This override widens the return type for affected components.
import * as React from 'react';

declare module 'recharts' {
  export class PolarAngleAxis extends React.Component<any> {
    render(): React.JSX.Element | null;
  }
  export class PolarRadiusAxis extends React.Component<any> {
    render(): React.JSX.Element | null;
  }
  export class PolarGrid extends React.Component<any> {
    render(): React.JSX.Element | null;
  }
  export class Radar extends React.Component<any> {
    render(): React.JSX.Element | null;
  }
  export class RadarChart extends React.Component<any> {
    render(): React.JSX.Element | null;
  }
}
