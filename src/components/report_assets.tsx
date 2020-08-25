import { ChartData } from 'chart.js';
import moment from 'moment';
import * as React from 'react';
import { getRepository as repo } from 'typeorm';

import { Transaction } from '../models/transaction';
import { makeBalance } from '../utils/factory';
import { logger } from '../utils/logger';
import { calculateBalance } from '../utils/money';
import { LineChart } from './line_chart';

const kGapDays = 15;

export const ReportAssets = () => {
  const [data, setData] = React.useState<ChartData>({});

  React.useEffect(() => {
    buildData();
  }, []);

  async function buildData() {
    try {
      // TODO: calculate with currency rate.
      let transactions = await repo(Transaction).find({
        order: {
          date: 'ASC',
        },
        relations: ['account'],
      });
      const data: number[] = [];
      const chartData: ChartData = {
        labels: [],
        datasets: [
          {
            data,
            borderColor: '#5a92df',
            backgroundColor: 'rgba(90,146,223, 0.3)',
            pointBackgroundColor: '#5a92df',
          },
        ],
      };

      // Fill dataset.
      let startDate = moment(transactions[0].date);
      let i = 0;
      let balance = makeBalance();
      // A temp list of transactions.
      let stagings: Transaction[] = [];
      let stoneDate = startDate;

      while (i < transactions.length) {
        let transaction = transactions[i];

        if (moment(transaction.date).isAfter(stoneDate)) {
          chartData.labels.push(stoneDate.format('YYYY-MM'));
          balance = calculateBalance(stagings, balance);
          data.push(balance.clearedDebit - balance.clearedCredit);

          stoneDate = stoneDate.add(kGapDays, 'days');
          stagings = [transaction];
        } else {
          stagings.push(transaction);
        }
        i++;
      }

      setData(chartData);
    } catch (err) {
      logger.error('Failed to build data.', err);
    }
  }

  return (
    <div className='ReportAssets'>
      <LineChart data={data} />
    </div>
  );
};
