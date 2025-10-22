"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import { ptBR } from 'date-fns/locale';

interface ContactCountyBarChartProps {
  currentContacts: Contact[]; // Contactos do período atual
  previousContacts: Contact[]; // Contactos do período anterior
  selectedPeriod: "today" | "week" | "month" | "year" | "all";
}

const ContactCountyBarChart: React.FC<ContactCountyBarChartProps> = ({ currentContacts, previousContacts, selectedPeriod }) => {
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getPreviousPeriodLabel = (period: string) => {
    switch (period) {
      case "today":
        return "Ontem";
      case "week":
        return "Semana Anterior";
      case "month":
        return "Mês Anterior";
      case "year":
        return "Ano Anterior";
      default:
        return "Período Anterior";
    }
  };

  const data = React.useMemo(() => {
    const processCounts = (contactList: Contact[]) => {
      const counts: { [key: string]: number } = {};
      contactList.forEach(contact => {
        const county = contact.concelho ? contact.concelho.toLowerCase() : 'desconhecido';

        // Excluir "questionar cliente" e "sem informação"
        if (county === 'questionar cliente' || county === 'sem informação') {
          return;
        }
        counts[county] = (counts[county] || 0) + 1;
      });
      return counts;
    };

    const currentCounts = processCounts(currentContacts);
    const previousCounts = processCounts(previousContacts);

    const allCounties = Array.from(new Set([...Object.keys(currentCounts), ...Object.keys(previousCounts)]));

    const chartData = allCounties.map(county => ({
      name: county,
      currentValue: currentCounts[county] || 0,
      previousValue: previousCounts[county] || 0,
    }));

    // Sort the data by current value in descending order, then by name alphabetically
    chartData.sort((a, b) => {
      if (b.currentValue !== a.currentValue) {
        return b.currentValue - a.currentValue;
      }
      return a.name.localeCompare(b.name);
    });

    return chartData;
  }, [currentContacts, previousContacts]);

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    if (value === 0) return null;

    const offset = 8;
    return (
      <text
        x={x + width - offset}
        y={y + height / 2}
        fill="hsl(var(--primary-foreground))" // Cor do texto para o valor
        textAnchor="end"
        dominantBaseline="middle"
        className="text-sm font-semibold"
      >
        {value}
      </text>
    );
  };

  const minCategoryHeight = 45;
  const baseChartPadding = 100;
  const dynamicChartHeight = data.length > 0
    ? Math.max(150, data.length * minCategoryHeight + baseChartPadding)
    : 150;

  const maxTotalValue = Math.max(...data.flatMap(d => [d.currentValue, d.previousValue]), 0);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Contactos por Concelho</CardTitle>
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
                left: 100,
                bottom: 5,
              }}
              barGap={4} // Espaçamento entre as barras de cada categoria
              barCategoryGap={10} // Espaçamento entre as categorias
            >
              <XAxis type="number" hide={true} domain={[0, maxTotalValue * 1.1]} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-sm"
                width={90}
                interval={0}
                tickFormatter={capitalizeFirstLetter}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [`${value}`, capitalizeFirstLetter(name)]}
                labelFormatter={(label: string) => capitalizeFirstLetter(label)}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => {
                  if (value === 'currentValue') return `Período Atual`;
                  if (value === 'previousValue') return getPreviousPeriodLabel(selectedPeriod);
                  return value;
                }}
              />
              {/* Ordem das barras: currentValue primeiro, depois previousValue */}
              <Bar dataKey="currentValue" name="currentValue" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={20}>
                <LabelList dataKey="currentValue" content={renderCustomizedLabel} /> {/* Label na barra do período atual */}
              </Bar>
              <Bar dataKey="previousValue" name="previousValue" fill="hsl(var(--secondary-darker))" radius={[4, 4, 4, 4]} barSize={20}>
                <LabelList dataKey="previousValue" content={renderCustomizedLabel} /> {/* Label na barra do período anterior */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto para exibir por concelho neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCountyBarChart;