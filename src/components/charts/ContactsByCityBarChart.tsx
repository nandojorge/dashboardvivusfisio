"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months" | "custom";

interface ContactsByCityBarChartProps {
  currentContacts: Contact[];
  selectedPeriod: FilterPeriod;
  dateRange: { from?: Date; to?: Date };
}

const ContactsByCityBarChart: React.FC<ContactsByCityBarChartProps> = ({
  currentContacts,
  selectedPeriod,
  dateRange,
}) => {

  const data = useMemo(() => {
    const counts: { [city: string]: number } = {};
    currentContacts.forEach(contact => {
      const city = contact.concelho || 'Desconhecido';
      counts[city] = (counts[city] || 0) + 1;
    });

    const chartData = Object.keys(counts).map(city => ({
      name: city,
      value: counts[city],
    }));

    chartData.sort((a, b) => b.value - a.value);

    return chartData;
  }, [currentContacts]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{entry.value} Contactos</p>
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
      case "custom":
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
        }
        return "Período Personalizado";
      default: return "Período Atual";
    }
  };

  const minCategoryHeight = 45;
  const baseChartPadding = 100;
  const dynamicChartHeight = data.length > 0
    ? Math.max(150, data.length * minCategoryHeight + baseChartPadding)
    : 150;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contactos por Concelho</CardTitle>
        <CardDescription>Distribuição de contactos por concelho para {getPeriodLabel(selectedPeriod)}</CardDescription>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 5,
              }}
            >
              <XAxis type="number" hide={true} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-xs"
                width={80}
                interval={0}
                tick={{ textAnchor: 'end' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={CustomTooltip}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} />
            </BarChart>
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

export { ContactsByCityBarChart };