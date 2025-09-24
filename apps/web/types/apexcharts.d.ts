declare module 'apexcharts' {
  export interface ApexOptions {
    chart?: any;
    xaxis?: any;
    yaxis?: any;
    grid?: any;
    plotOptions?: any;
    tooltip?: any;
    annotations?: any;
    [key: string]: any;
  }
}

declare module 'react-apexcharts' {
  import { Component } from 'react';
  import { ApexOptions } from 'apexcharts';

  interface ChartProps {
    options: ApexOptions;
    series: any[];
    type: string;
    height?: number | string;
    width?: number | string;
  }

  export default class Chart extends Component<ChartProps> {}
}
