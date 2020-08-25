import { Chart, ChartData } from 'chart.js';
import * as React from 'react';

interface IProps {
  data: ChartData;
}

export const LineChart = (props: IProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>();
  React.useEffect(() => {
    if (!canvasRef.current) return;

    new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: props.data,
      options: {
        responsive: true,
        legend: {
          display: false,
        },
      },
    });
  }, [canvasRef, props.data]);
  return (
    <div className='LineChart'>
      <canvas ref={canvasRef} />
    </div>
  );
};
