"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ContactOriginBarChartProps {
  contacts: Contact[]; // Contactos do período atual
}

const ContactOriginBarChart: React.FC<ContactOriginBarChartProps> = ({ contacts }) => {
  const data = React.useMemo(() => {
    const processContacts = (contactList: Contact[]) => {
      const originCounts: { [key: string]: number } = {};
      contactList.forEach(contact => {
        const origin = contact.origemcontacto ? contact.origemcontacto.toLowerCase() : 'desconhecida';
        originCounts[origin] = (originCounts[origin] || 0) + 1;
      });
      return originCounts;
    };

    const currentOriginCounts = processContacts(contacts);

    const chartData = Object.keys(currentOriginCounts).map(origin => ({
      name: origin,
      value: currentOriginCounts[origin] || 0,
    }));

    // Sort the data by value in descending order, then by name alphabetically
    chartData.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return a.name.localeCompare(b.name);
    });

    return chartData;
  }, [contacts]);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Custom label formatter for BarChart to display the count inside the bar
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    if (value === 0) return null; // Don't show label for zero values

    // Position the label inside the bar, aligned to the right
    const offset = 8; // Padding from the right edge of the bar
    return (
      <text
        x={x + width - offset}
        y={y + height / 2}
        fill="hsl(var(--primary-foreground))" // White text
        textAnchor="end"
        dominantBaseline="middle"
        className="text-sm font-semibold"
      >
        {value}
      </text>
    );
  };

  // Calculate dynamic height for the chart based on number of bars
  const minCategoryHeight = 45;
  const baseChartPadding = 100;
  const dynamicChartHeight = data.length > 0
    ? Math.max(150, data.length * minCategoryHeight + baseChartPadding)
    : 150;

  // Calculate max value for X-axis domain
  const maxTotalValue = Math.max(...data.map(d => d.value), 0);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Contactos por Origem</CardTitle>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{
                top: 20,
                right: 20, // Ajustado para acomodar o valor dentro da barra
                left: 100, // Mais espaço para os nomes das categorias
                bottom: 5,
              }}
              barGap={8} // Espaçamento entre as barras
            >
              {/* CartesianGrid removido */}
              <XAxis type="number" hide={true} domain={[0, maxTotalValue * 1.1]} /> {/* Eixo X escondido */}
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-sm"
                width={90} // Mais largura para os nomes das categorias
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
                formatter={(value: number) => [`${value}`, 'Contactos']} // Apenas o valor
                labelFormatter={(label: string) => capitalizeFirstLetter(label)}
              />
              {/* Legend removida */}
              <Bar dataKey="value" name="Contactos" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={30}>
                <LabelList dataKey="value" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto para exibir a origem neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactOriginBarChart;