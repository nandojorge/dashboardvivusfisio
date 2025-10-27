"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Contact } from "@/types/contact";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

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
  const processData = (contacts: Contact[]) => {
    const countyCounts: { [key: string]: number } = {};
    contacts.forEach((contact) => {
      const county = contact.concelho || "Desconhecido";
      countyCounts[county] = (countyCounts[county] || 0) + 1;
    });
    return Object.entries(countyCounts)
      .map(([county, count]) => ({ county, count }))
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
        "Período Atual": counts.current,
        "Período Anterior": counts.previous,
      }))
      .sort((a, b) => b["Período Atual"] - a["Período Atual"]);
  }, [currentData, previousData]);

  const dynamicChartHeight = Math.max(300, data.length * 40); // Minimum 300px, 40px per bar

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.dataKey === "Período Atual");
      const previous = payload.find((p: any) => p.dataKey === "Período Anterior");

      const currentValue = current ? current.value : 0;
      const previousValue = previous ? previous.value : 0;

      const percentageChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : (currentValue > 0 ? 100 : 0);

      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="text-sm font-bold">{label}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">Atual</span>
              <span className="font-bold text-muted-foreground">{currentValue}</span>
            </div>
            {selectedPeriod !== "all" && (
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">Anterior</span>
                <span className="font-bold text-muted-foreground">{previousValue}</span>
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
              <span className="ml-1 text-muted-foreground">vs. Período Anterior</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        {/* <CardTitle>Contactos por Concelho</CardTitle> */} {/* Título removido */}
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="county"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100} // Adjust width for longer county names
              />
              <Tooltip content={<CustomTooltip selectedPeriod={selectedPeriod} />} />
              <Legend />
              <Bar dataKey="Período Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              {selectedPeriod !== "all" && (
                <Bar dataKey="Período Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Não há dados de concelhos para o período selecionado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCountyBarChart;