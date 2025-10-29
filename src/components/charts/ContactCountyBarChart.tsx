"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CardContent } from '@/components/ui/card';

interface ContactCountyBarChartProps {
  data: { name: string; count: number }[];
  dynamicChartHeight: string;
}

const ContactCountyBarChart: React.FC<ContactCountyBarChartProps> = ({ data, dynamicChartHeight }) => {
  return (
    <CardContent style={{ height: dynamicChartHeight }} className="p-4">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend wrapperStyle={{ color: 'black' }} />
            <Bar dataKey="count" fill="#888888" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available for this period.
        </div>
      )}
    </CardContent>
  );
};

export default ContactCountyBarChart;