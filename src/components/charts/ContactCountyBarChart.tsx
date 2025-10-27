"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { CardContent } from "@/components/ui/card"; // CardHeader e Card removidos
import { Contact } from "@/types/contact";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ptBR } from "date-fns/locale"; // Importar locale para consistência

interface ContactCountyBarChartProps {
  currentContacts: Contact[];
  previousContacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months";
}

const ContactCountyBarChart: React.FC<ContactCountyBarChartProps> = ({
  currentContacts,
  previousContacts,
  selectedPeriod,
}) => {
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getPreviousPeriodLabel = (period: string) => {
    switch (period) {
      case "today":
        return "Ontem";
      case "7days":
        return "7 Dias Anteriores";
      case "30days":
        return "30 Dias Anteriores";
      case "60days":
        return "60 Dias Anteriores";
      case "12months":
        return "12 Meses Anteriores";
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

  const processData = (contacts: Contact[]) => {
    const countyCounts: { [key: string]: number } = {};
    contacts.forEach((contact) => {
      const county = contact.concelho || "Desconhecido"; // Keep "Desconhecido" for processing, but filter out later if needed
      countyCounts[county] = (countyCounts[county] || 0) + 1;
    });
    return Object.entries(countyCounts)
      .map(([county, count]) => ({ county, count }))
      .filter(item => item.county !== "Desconhecido") // Filter out "Desconhecido" here
      .sort((a, b) => b.count - a.count);
  };

  const currentData = useMemo(() => processData(currentContacts), [currentContacts]);
  const previousData = useMemo(() => processData(previousContacts), [previousContacts]);

  const data = useMemo(() => {
    const combinedMap = new Map<string, { current: number; previous: number }>();

    currentData.forEach(item => {
      combinedMap.set(item.county, { current: item.count, previous: 0 });
    });

    previousData.forEach(item => {
      if (combinedMap.has(item.county)) {
        combinedMap.get(item.county)!.previous = item.count;
      } else {
        combinedMap.set(item.county, { current: 0, previous: item.count });
      }
    });

    return Array.from(combinedMap.entries())
      .map(([county, counts]) => ({
        county,
        currentValue: counts.current,
        previousValue: counts.previous,
      }))
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [currentData, previousData]);

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    if (value === 0) return null;

    const offset = 8; // Espaçamento do lado de fora da barra
    return (
      <text
        x={x + width + offset} // Move o texto para fora da barra, à direita
        y={y + height / 2}
        fill="hsl(var(--foreground))" // Cor do texto para o valor
        textAnchor="start" // Alinha o texto para começar a partir da posição x
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.dataKey === "currentValue");
      const previous = payload.find((p: any) => p.dataKey === "previousValue");

      const currentValue = current ? current.value : 0;
      const previousValue = previous ? previous.value : 0;

      const percentageChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : (currentValue > 0 ? 100 : 0);

      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="text-sm font-bold text-foreground">{capitalizeFirstLetter(label)}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">Atual</span>
              <span className="font-bold text-foreground">{currentValue}</span>
            </div>
            {selectedPeriod !== "all" && (
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">Anterior</span>
                <span className="font-bold text-foreground">{previousValue}</span>
            </div>
            )}
          </div>
          {selectedPeriod !== "all" && (
            <div className="flex items-center text-xs mt-1">
              {percentageChange > 0 && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
              {percentageChange < 0 && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
              <span className={cn(
                percentageChange > 0 && "text-green-500",
                percentageChange < 0 && "text-red-500",
                percentageChange === 0 && "text-muted-foreground"
              )}>
                {percentageChange.toFixed(1)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs. {getPreviousPeriodLabel(selectedPeriod)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
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
            barGap={4}
            barCategoryGap={40}
          >
            <XAxis type="number" hide={true} domain={[0, maxTotalValue * 1.1]} />
            <YAxis
              type="category"
              dataKey="county"
              tickLine={false}
              axisLine={false}
              className="text-sm"
              width={90}
              interval={0}
              tickFormatter={capitalizeFirstLetter}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={CustomTooltip}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value: string) => {
                if (value === 'currentValue') return `Período Atual`;
                if (value === 'previousValue') return getPreviousPeriodLabel(selectedPeriod);
                return value;
              }}
            />
            <Bar dataKey="currentValue" name="currentValue" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={20}>
              <LabelList dataKey="currentValue" content={renderCustomizedLabel} />
            </Bar>
            {selectedPeriod !== "all" && (
              <Bar dataKey="previousValue" name="previousValue" fill="hsl(var(--secondary-darker))" radius={[4, 4, 4, 4]} barSize={20}>
                <LabelList dataKey="previousValue" content={renderCustomizedLabel} />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Não há dados de concelhos para o período selecionado.
        </div>
      )}
    </CardContent>
  );
};

export default ContactCountyBarChart;