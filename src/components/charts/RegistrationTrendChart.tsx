"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  setDate, getDayOfYear, setDayOfYear, getDay, getDate,
  isBefore, isSameDay,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getYear,
} from 'date-fns';
import { ptBR } = from 'date-fns/locale';
// import { Toggle } from "@/components/ui/toggle"; // Removido: O Toggle será gerido externamente
// import { cn } from "@/lib/utils"; // Removido: cn não é mais necessário aqui

interface RegistrationTrendChartProps {
  contacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all";
  isAdjustingComparisons: boolean; // Nova prop
}

// Helper function to get the real-time cutoff date for a given period's start date
const getRealTimeCutoffDate = (periodStartDate: Date, selectedPeriod: "week" | "month" | "year", now: Date): Date => {
  let cutoffDate = periodStartDate;

  switch (selectedPeriod) {
    case "week":
      // Cutoff is the same day of the week as 'now' within the 'periodStartDate' week
      const currentDayOfWeek = getDay(now); // 0 (Sun) - 6 (Sat)
      cutoffDate = addDays(startOfWeek(periodStartDate, { weekStartsOn: 0, locale: ptBR }), currentDayOfWeek);
      return endOfDay(cutoffDate); // Include the entire cutoff day
    case "month":
      // Cutoff is the same day of the month as 'now' within the 'periodStartDate' month
      const currentDayOfMonth = getDate(now);
      cutoffDate = setDate(startOfMonth(periodStartDate), currentDayOfMonth);
      return endOfDay(cutoffDate);
    case "year":
      // Cutoff is the same day of the year as 'now' within the 'periodStartDate' year
      const currentDayOfYear = getDayOfYear(now);
      cutoffDate = setDayOfYear(startOfYear(periodStartDate), currentDayOfYear);
      return endOfDay(cutoffDate);
    default:
      return now; // Should not be reached for these periods
  }
};

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({ contacts, selectedPeriod, isAdjustingComparisons }) => {
  const { data, numberOfYearsWithRecords } = React.useMemo(() => {
    if (!contacts || contacts.length === 0) {
      return { data: [], numberOfYearsWithRecords: 0 };
    }

    const now = new Date();
    const aggregatedData: { [key: string]: number } = {};
    let dateFormat: string;
    let aggregateBy: (date: Date) => Date;
    let addUnit: (date: Date, amount: number) => Date;

    switch (selectedPeriod) {
      case "today":
        dateFormat = 'dd/MM';
        aggregateBy = startOfDay;
        addUnit = addDays;
        break;
      case "week":
        dateFormat = 'dd/MM'; // Display start of week
        aggregateBy = (date) => startOfWeek(date, { weekStartsOn: 0, locale: ptBR });
        addUnit = addWeeks;
        break;
      case "month":
        // For 'month', aggregate by month
        dateFormat = 'MMM/yy'; // Display month and year
        aggregateBy = startOfMonth;
        addUnit = addMonths;
        break;
      case "year":
      case "all": // Both 'year' and 'all' aggregate by year
        dateFormat = 'yyyy';
        aggregateBy = startOfYear;
        addUnit = addYears;
        break;
      default:
        dateFormat = 'dd/MM/yyyy';
        aggregateBy = startOfDay;
        addUnit = addDays;
    }

    contacts.forEach(contact => {
      if (contact.dataregisto) {
        const date = parseISO(contact.dataregisto);
        if (!isNaN(date.getTime())) {
          let shouldInclude = true;

          if (isAdjustingComparisons && (selectedPeriod === "week" || selectedPeriod === "month" || selectedPeriod === "year")) {
            const cutoffDateForThisContactPeriod = getRealTimeCutoffDate(date, selectedPeriod, now);

            // Only include if the contact date is before or on the cutoff date for its period
            if (isBefore(date, cutoffDateForThisContactPeriod) || isSameDay(date, cutoffDateForThisContactPeriod)) {
                // This contact is before or on the cutoff, so it's included
            } else {
                shouldInclude = false; // This contact is after the cutoff for its period
            }
          }

          if (shouldInclude) {
            const key = format(aggregateBy(date), dateFormat, { locale: ptBR });
            aggregatedData[key] = (aggregatedData[key] || 0) + 1;
          }
        }
      }
    });

    const chartData: { name: string; registrations: number }[] = [];
    
    let earliestContactDate = now;
    if (contacts.length > 0) {
      earliestContactDate = contacts.reduce((minDate, contact) => {
        if (contact.dataregisto) {
          const date = parseISO(contact.dataregisto);
          if (!isNaN(date.getTime()) && isBefore(date, minDate)) {
            return date;
          }
        }
        return minDate;
      }, now);
    }

    let minYear = getYear(earliestContactDate);
    const currentYear = getYear(now);
    let calculatedNumberOfYears = 0;

    if (selectedPeriod === "year" || selectedPeriod === "all") {
      // For 'year' and 'all', iterate from the earliest year to the current year
      for (let year = minYear; year <= currentYear; year++) {
        const periodStart = startOfYear(new Date(year, 0, 1)); // Jan 1st of the year
        const key = format(periodStart, dateFormat, { locale: ptBR });
        chartData.push({
          name: key,
          registrations: aggregatedData[key] || 0,
        });
      }
      calculatedNumberOfYears = currentYear - minYear + 1;
    } else {
      // For other periods, go back up to 20 periods, or until the earliest contact date
      for (let i = 0; i < 20; i++) {
        const periodStart = aggregateBy(addUnit(now, -i));
        if (isBefore(periodStart, aggregateBy(earliestContactDate)) && i > 0) {
          break; // Stop if we go before the earliest contact date
        }
        const key = format(periodStart, dateFormat, { locale: ptBR });
        chartData.unshift({
          name: key,
          registrations: aggregatedData[key] || 0,
        });
      }
    }

    return { data: chartData, numberOfYearsWithRecords: calculatedNumberOfYears };
  }, [contacts, selectedPeriod, isAdjustingComparisons]);

  const getChartTitle = () => {
    let title = "Evolução Temporal dos Registos";
    switch (selectedPeriod) {
      case "today":
        title = "Registos Diários (20 Dias)";
        break;
      case "week":
        title = "Registos Semanais (20 Semanas)";
        break;
      case "month":
        title = "Registos Mensais (20 Meses)";
        break;
      case "year":
      case "all":
        title = `Registos Anuais (${numberOfYearsWithRecords} Anos)`;
        break;
    }
    return title;
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getChartTitle()}</CardTitle>
        {/* Botão "Ajustar Comparações" removido daqui, agora está em Dashboard.tsx */}
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" interval={2} />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} registos`, 'Registos']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                name="Registos"
              />
            </LineChart>
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

export default RegistrationTrendChart;