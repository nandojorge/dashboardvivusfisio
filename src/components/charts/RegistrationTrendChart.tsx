"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from "@/types/contact";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval,
  format, setDate, getDayOfYear, setDayOfYear, getDay, getDate,
  isBefore, isSameDay, addDays, isAfter, differenceInYears, addYears, addMonths, addWeeks
} from "date-fns";
import { ptBR } = from "date-fns/locale";

type FilterPeriod = "today" | "7days" | "30days" | "60days" | "12months" | "week" | "month" | "year" | "all";
type GroupUnit = 'day' | 'week' | 'month' | 'year';

interface RegistrationTrendChartProps {
  allContacts: Contact[]; // Unfiltered contacts
  allLeads: Contact[];    // Unfiltered leads
  selectedPeriod: FilterPeriod;
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({
  allContacts,
  allLeads,
  selectedPeriod,
}) => {
  // If "all" period is selected, do not render the component at all
  if (selectedPeriod === "all") {
    return null;
  }

  const processDataForChart = (
    contacts: Contact[],
    leads: Contact[],
    selectedPeriod: FilterPeriod,
  ) => {
    const now = new Date();
    const combinedRawData = [...contacts, ...leads];

    // 1. Determine the actual min and max dates from ALL raw data
    let minOverallDataDate: Date | null = null;
    let maxOverallDataDate: Date | null = null;

    if (combinedRawData.length > 0) {
      combinedRawData.forEach(item => {
        const dateString = item.datacontactolead || item.dataregisto;
        if (dateString) {
          const itemDate = parseISO(dateString);
          if (!isNaN(itemDate.getTime())) {
            if (minOverallDataDate === null || isBefore(itemDate, minOverallDataDate)) {
              minOverallDataDate = itemDate;
            }
            if (maxOverallDataDate === null || isAfter(itemDate, maxOverallDataDate)) {
              maxOverallDataDate = itemDate;
            }
          }
        }
      });
    }

    if (!minOverallDataDate || !maxOverallDataDate) {
      return { chartData: [], groupUnit: 'day' };
    }

    // 2. Determine the chart's interval (start and end dates for the chart) and grouping unit
    let finalIntervalStart: Date;
    let finalGroupUnit: GroupUnit;
    const intervalEnd: Date = endOfDay(now); // Always end at the end of today for trend charts

    switch (selectedPeriod) {
      case "today":
        finalIntervalStart = startOfDay(subDays(now, 19)); // Last 20 days (today + 19 previous days)
        finalGroupUnit = 'day';
        break;
      case "7days":
        finalIntervalStart = startOfDay(subDays(now, 6)); // Last 7 days (today + 6 previous days)
        finalGroupUnit = 'day';
        break;
      case "30days":
        finalIntervalStart = startOfDay(subDays(now, 29)); // Last 30 days (today + 29 previous days)
        finalGroupUnit = 'day';
        break;
      case "60days":
        finalIntervalStart = startOfDay(subDays(now, 59)); // Last 60 days (today + 59 previous days)
        finalGroupUnit = 'day';
        break;
      case "week":
        finalIntervalStart = startOfWeek(subWeeks(now, 19), { weekStartsOn: 0, locale: ptBR }); // Last 20 weeks (current week + 19 previous weeks)
        finalGroupUnit = 'week';
        break;
      case "month":
        finalIntervalStart = startOfMonth(subMonths(now, 19)); // Last 20 months (current month + 19 previous months)
        finalGroupUnit = 'month';
        break;
      case "12months":
        finalIntervalStart = startOfMonth(subMonths(now, 11)); // Last 12 months (current month + 11 previous months)
        finalGroupUnit = 'month';
        break;
      case "year":
        finalIntervalStart = startOfYear(minOverallDataDate); // All years from the earliest record
        finalGroupUnit = 'year';
        break;
      default:
        finalIntervalStart = startOfDay(subDays(now, 19)); // Default to last 20 days
        finalGroupUnit = 'day';
        break;
    }

    // Filter the combined raw data based on the determined interval
    const itemsInInterval = combinedRawData.filter(item => {
      const dateString = item.datacontactolead || item.dataregisto;
      if (!dateString) return false;
      const itemDate = parseISO(dateString);
      if (isNaN(itemDate.getTime())) return false;
      return isWithinInterval(itemDate, { start: finalIntervalStart, end: intervalEnd });
    });

    // If no items in the interval, return empty
    if (itemsInInterval.length === 0) {
      return { chartData: [], groupUnit: finalGroupUnit };
    }

    // 3. Generate the date range for the chart's X-axis
    const generateDateRange = (start: Date, end: Date, unit: GroupUnit) => {
      const dates: Date[] = [];
      let currentDate = start;

      while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
        dates.push(currentDate);
        if (unit === 'day') {
          currentDate = addDays(currentDate, 1);
        } else if (unit === 'week') {
          currentDate = addWeeks(currentDate, 1);
        } else if (unit === 'month') {
          currentDate = addMonths(currentDate, 1);
        } else if (unit === 'year') {
          currentDate = addYears(currentDate, 1);
        }
      }
      return dates;
    };

    const dateRange = generateDateRange(finalIntervalStart, intervalEnd, finalGroupUnit);

    // 4. Initialize data map for chart
    const dateMap: { [key: string]: { date: Date; count: number; formattedDate: string } } = {};
    dateRange.forEach(date => {
      let key: string;
      if (finalGroupUnit === 'day') {
        key = format(date, 'yyyy-MM-dd');
      } else if (finalGroupUnit === 'week') {
        key = format(startOfWeek(date, { weekStartsOn: 0, locale: ptBR }), 'yyyy-MM-dd'); // Key by start of week
      } else if (finalGroupUnit === 'month') {
        key = format(startOfMonth(date), 'yyyy-MM');
      } else { // year
        key = format(startOfYear(date), 'yyyy');
      }
      dateMap[key] = { date, count: 0, formattedDate: formatDateLabel(date, finalGroupUnit) };
    });

    // 5. Populate data map with actual counts
    itemsInInterval.forEach(item => {
      const dateString = item.datacontactolead || item.dataregisto;
      if (dateString) {
        const itemDate = parseISO(dateString);
        if (!isNaN(itemDate.getTime())) {
          let key: string;
          let dateToGroup = itemDate;

          if (finalGroupUnit === 'day') {
            key = format(dateToGroup, 'yyyy-MM-dd');
          } else if (finalGroupUnit === 'week') {
            dateToGroup = startOfWeek(dateToGroup, { weekStartsOn: 0, locale: ptBR });
            key = format(dateToGroup, 'yyyy-MM-dd');
          } else if (finalGroupUnit === 'month') {
            dateToGroup = startOfMonth(dateToGroup);
            key = format(dateToGroup, 'yyyy-MM');
          } else { // year
            dateToGroup = startOfYear(dateToGroup);
            key = format(dateToGroup, 'yyyy');
          }

          if (dateMap[key]) {
            dateMap[key].count++;
          }
        }
      }
    });

    // 6. Convert map to array and sort by date
    const chartData = Object.values(dateMap).sort((a, b) => a.date.getTime() - b.date.getTime());

    return { chartData, groupUnit: finalGroupUnit };
  };

  const formatDateLabel = (date: Date, groupUnit: GroupUnit) => {
    if (groupUnit === 'day') {
      return format(date, 'dd/MM', { locale: ptBR });
    } else if (groupUnit === 'week') {
      // Format for week: "Semana de dd/MM"
      return `Semana de ${format(startOfWeek(date, { weekStartsOn: 0, locale: ptBR }), 'dd/MM', { locale: ptBR })}`;
    } else if (groupUnit === 'month') {
      return format(date, 'MMM yyyy', { locale: ptBR });
    } else if (groupUnit === 'year') {
      return format(date, 'yyyy', { locale: ptBR });
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR }); // Fallback
  };

  const { chartData, groupUnit } = useMemo(() => {
    return processDataForChart(allContacts, allLeads, selectedPeriod);
  }, [allContacts, allLeads, selectedPeriod]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tendência de Registos</CardTitle>
        <CardDescription>
          Número de registos ao longo do tempo para o período selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDateLabel(value, groupUnit)}
                interval="preserveStartEnd" // Helps with label density
                minTickGap={30} // Minimum gap between ticks
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(label) => formatDateLabel(label, groupUnit)}
                formatter={(value: number) => [`${value} registos`, "Total"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Registos"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Não há dados para o período selecionado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationTrendChart;