"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Contact } from "@/types/contact";
import { cn } from "@/lib/utils";

interface ContactBarChartSwitcherProps {
  currentContacts: Contact[];
  previousContacts: Contact[];
  selectedPeriod: "today" | "7days" | "30days" | "60days" | "12months" | "week" | "month" | "year" | "all";
}

const ContactBarChartSwitcher: React.FC<ContactBarChartSwitcherProps> = ({
  currentContacts,
  previousContacts,
  selectedPeriod,
}) => {
  const [chartType, setChartType] = useState<"origem" | "concelho" | "servico">("origem");

  const processChartData = (
    currentItems: Contact[],
    previousItems: Contact[],
    type: "origem" | "concelho" | "servico"
  ) => {
    const currentCounts: { [key: string]: number } = {};
    const previousCounts: { [key: string]: number } = {};
    const allKeys = new Set<string>();

    currentItems.forEach((item) => {
      let key: string | undefined;
      if (type === "origem") {
        key = item.origemcontacto?.toLowerCase() || "desconhecida";
      } else if (type === "concelho") {
        key = item.concelho?.toLowerCase() || "desconhecido";
      } else if (type === "servico" && item.isLead) { // Only count leads for 'servico'
        key = item.servico?.toLowerCase() || "desconhecido";
      }

      if (key) {
        currentCounts[key] = (currentCounts[key] || 0) + 1;
        allKeys.add(key);
      }
    });

    previousItems.forEach((item) => {
      let key: string | undefined;
      if (type === "origem") {
        key = item.origemcontacto?.toLowerCase() || "desconhecida";
      } else if (type === "concelho") {
        key = item.concelho?.toLowerCase() || "desconhecido";
      } else if (type === "servico" && item.isLead) { // Only count leads for 'servico'
        key = item.servico?.toLowerCase() || "desconhecido";
      }

      if (key) {
        previousCounts[key] = (previousCounts[key] || 0) + 1;
        allKeys.add(key);
      }
    });

    const data = Array.from(allKeys).map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize for display
      current: currentCounts[key] || 0,
      previous: previousCounts[key] || 0,
    }));

    return data.sort((a, b) => b.current - a.current); // Sort by current count descending
  };

  const chartData = useMemo(() => {
    return processChartData(currentContacts, previousContacts, chartType);
  }, [currentContacts, previousContacts, chartType]);

  const getChartTitle = () => {
    switch (chartType) {
      case "origem":
        return "Contactos por Origem";
      case "concelho":
        return "Contactos por Concelho";
      case "servico":
        return "Leads por Serviço";
      default:
        return "Dados do Gráfico";
    }
  };

  const getXAxisLabel = () => {
    switch (chartType) {
      case "origem":
        return "Origem";
      case "concelho":
        return "Concelho";
      case "servico":
        return "Serviço";
      default:
        return "";
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getChartTitle()}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType("origem")}
            className={cn(chartType === "origem" && "bg-primary text-primary-foreground")}
          >
            Origem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType("concelho")}
            className={cn(chartType === "concelho" && "bg-primary text-primary-foreground")}
          >
            Concelho
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType("servico")}
            className={cn(chartType === "servico" && "bg-primary text-primary-foreground")}
          >
            Serviço
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0} // Ensure all labels are shown
                angle={-45} // Rotate labels for better readability
                textAnchor="end" // Anchor text at the end of the tick
                height={60} // Give more height for rotated labels
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const currentEntry = payload.find(entry => entry.dataKey === 'current');
                    const previousEntry = payload.find(entry => entry.dataKey === 'previous');
                    return (
                      <div className="rounded-lg border bg-card p-2 shadow-sm">
                        <div className="text-sm font-bold text-foreground">{label}</div>
                        {currentEntry && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {selectedPeriod === "all" ? "Total" : "Atual"}
                            </span>
                            <span className="font-bold text-foreground" style={{ color: currentEntry.color }}>
                              {currentEntry.value}
                            </span>
                          </div>
                        )}
                        {previousEntry && selectedPeriod !== "all" && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Anterior</span>
                            <span className="font-bold text-foreground" style={{ color: previousEntry.color }}>
                              {previousEntry.value}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => {
                  if (value === 'current') return <span className="text-black">{selectedPeriod === "all" ? "Total" : "Atual"}</span>;
                  if (value === 'previous') return <span className="text-black">Anterior</span>;
                  return <span className="text-black">{value}</span>;
                }}
              />
              <Bar dataKey="current" name={selectedPeriod === "all" ? "Total" : "Atual"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              {selectedPeriod !== "all" && (
                <Bar dataKey="previous" name="Anterior" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum registo para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactBarChartSwitcher;