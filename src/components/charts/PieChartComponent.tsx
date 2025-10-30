"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contact } from '@/types/contact';

interface PieChartComponentProps {
  contacts: Contact[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6F61', '#6B5B95', '#88B04B'];

const PieChartComponent: React.FC<PieChartComponentProps> = ({ contacts }) => {
  const data = useMemo(() => {
    const originCounts: { [key: string]: number } = {};
    contacts.forEach(contact => {
      const origin = contact.origemcontacto || 'Desconhecido';
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    return Object.keys(originCounts).map(origin => ({
      name: origin,
      value: originCounts[origin],
    }));
  }, [contacts]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <p className="text-sm font-bold text-foreground">{payload[0].name}</p>
          <p className="text-[0.70rem] uppercase text-muted-foreground">
            Valor: <span className="font-bold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contactos por Origem</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum dado para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { PieChartComponent };