"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import { cn } from "@/lib/utils";

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months" | "custom";

interface PieChartComponentProps {
  currentContacts: Contact[];
  previousContacts: Contact[]; // Not used in this basic version, but kept for consistency
  selectedPeriod: FilterPeriod;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666', '#66CC99'];

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  currentContacts,
  selectedPeriod,
}) => {

  const data = useMemo(() => {
    const counts: { [origin: string]: number } = {};
    currentContacts.forEach(contact => {
      const origin = contact.origemcontacto || 'Desconhecida';
      counts[origin] = (counts[origin] || 0) + 1;
    });

    const chartData = Object.keys(counts).map(origin => ({
      name: origin,
      value: counts[origin],
    }));

    // Sort by value in descending order
    chartData.sort((a, b) => b.value - a.value);

    return chartData;
  }, [currentContacts]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <p className="text-sm font-bold text-foreground">{entry.name}</p>
          <p className="text-xs text-muted-foreground">{entry.value} ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const getPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today": return "Hoje";
      case "7days": return "Últimos 7 Dias";
      case "30days": return "Últimos 30 Dias";
      case "60days": return "Últimos 60 Dias";
      case "12months": return "Últimos 12 Meses";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
      case "year": return "Este Ano";
      case "all": return "Total";
      case "custom": return "Período Personalizado";
      default: return "Período Atual";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contactos por Origem</CardTitle>
        <CardDescription>Distribuição de contactos por origem para {getPeriodLabel(selectedPeriod)}</CardDescription>
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
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => value}
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