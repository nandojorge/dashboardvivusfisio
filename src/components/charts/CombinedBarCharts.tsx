"use client";

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Contact } from '@/types/contact';
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months";
type ChartType = "origin" | "county" | "service";

interface CombinedBarChartsProps {
  currentContacts: Contact[];
  previousContacts: Contact[];
  currentLeads: Contact[];
  previousLeads: Contact[];
  selectedPeriod: FilterPeriod;
}

const CombinedBarCharts: React.FC<CombinedBarChartsProps> = ({
  currentContacts,
  previousContacts,
  currentLeads,
  previousLeads,
  selectedPeriod,
}) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("origin");

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getPreviousPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today": return "Ontem";
      case "7days": return "7 Dias Anteriores";
      case "30days": return "30 Dias Anteriores";
      case "60days": return "60 Dias Anteriores";
      case "12months": return "12 Meses Anteriores";
      case "week": return "Semana Anterior";
      case "month": return "Mês Anterior";
      case "year": return "Ano Anterior";
      default: return "Período Anterior";
    }
  };

  const chartData = useMemo(() => {
    const processCounts = (itemList: Contact[], key: keyof Contact) => {
      const counts: { [value: string]: number } = {};
      itemList.forEach(item => {
        const value = item[key] ? String(item[key]).toLowerCase() : 'desconhecido';
        counts[value] = (counts[value] || 0) + 1;
      });
      return counts;
    };

    let currentCounts: { [value: string]: number };
    let previousCounts: { [value: string]: number };
    let allValues: string[];

    if (selectedChartType === "origin") {
      currentCounts = processCounts(currentContacts, "origemcontacto");
      previousCounts = processCounts(previousContacts, "origemcontacto");
    } else if (selectedChartType === "county") {
      currentCounts = processCounts(currentContacts, "concelho");
      previousCounts = processCounts(previousContacts, "concelho");
    } else { // "service"
      currentCounts = processCounts(currentLeads, "servico");
      previousCounts = processCounts(previousLeads, "servico");
    }

    allValues = Array.from(new Set([...Object.keys(currentCounts), ...Object.keys(previousCounts)]));

    const filteredValues = allValues.filter(value => value !== 'desconhecido');

    const data = filteredValues.map(value => ({
      name: value,
      currentValue: currentCounts[value] || 0,
      previousValue: previousCounts[value] || 0,
    }));

    data.sort((a, b) => {
      if (b.currentValue !== a.currentValue) {
        return b.currentValue - a.currentValue;
      }
      return a.name.localeCompare(b.name);
    });

    return data;
  }, [currentContacts, previousContacts, currentLeads, previousLeads, selectedChartType]);

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    const offset = 8;
    return (
      <text
        x={x + width + offset}
        y={y + height / 2}
        fill="hsl(var(--foreground))"
        textAnchor="start"
        dominantBaseline="middle"
        className="text-sm font-semibold"
      >
        {value}
      </text>
    );
  };

  const minCategoryHeight = 45;
  const baseChartPadding = 100;
  const dynamicChartHeight = chartData.length > 0
    ? Math.max(150, chartData.length * minCategoryHeight + baseChartPadding)
    : 150;

  const maxTotalValue = Math.max(...chartData.flatMap(d => [d.currentValue, d.previousValue]), 0);

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

  const getChartTitle = () => {
    switch (selectedChartType) {
      case "origin": return "Contactos por Origem";
      case "county": return "Contactos por Concelho";
      case "service": return "Leads por Serviço";
      default: return "Gráfico de Barras";
    }
  };

  return (
    <Card className="w-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{getChartTitle()}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={selectedChartType === "origin" ? "default" : "outline"}
            onClick={() => setSelectedChartType("origin")}
            size="sm"
          >
            Origem
          </Button>
          <Button
            variant={selectedChartType === "county" ? "default" : "outline"}
            onClick={() => setSelectedChartType("county")}
            size="sm"
          >
            Concelho
          </Button>
          <Button
            variant={selectedChartType === "service" ? "default" : "outline"}
            onClick={() => setSelectedChartType("service")}
            size="sm"
          >
            Serviço
          </Button>
        </div>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 30,
                bottom: 5,
              }}
              barGap={4}
              barCategoryGap={60}
            >
              <XAxis type="number" hide={true} domain={[0, maxTotalValue * 1.1]} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-sm"
                width={60}
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
            Nenhum dado para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CombinedBarCharts;