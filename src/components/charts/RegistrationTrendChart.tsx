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
  isBefore, isSameDay, addDays, isAfter, differenceInYears, addYears, addMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterPeriod = "today" | "7days" | "30days" | "60days" | "12months" | "week" | "month" | "year" | "all";

// Helper function to get the real-time cutoff date for a given period's start date
const getRealTimeCutoffDate = (periodStartDate: Date, selectedPeriod: "week" | "month" | "year", now: Date): Date => {
  let cutoffDate = periodStartDate;
  switch (selectedPeriod) {
    case "week":
      const currentDayOfWeek = getDay(now);
      cutoffDate = addDays(startOfWeek(periodStartDate, { weekStartsOn: 0, locale: ptBR }), currentDayOfWeek);
      return endOfDay(cutoffDate);
    case "month":
      const currentDayOfMonth = getDate(now);
      cutoffDate = setDate(startOfMonth(periodStartDate), currentDayOfMonth);
      return endOfDay(cutoffDate);
    case "year":
      const currentDayOfYear = getDayOfYear(now);
      cutoffDate = setDayOfYear(startOfYear(periodStartDate), currentDayOfYear);
      return endOfDay(cutoffDate);
    default:
      return now;
  }
};

// Helper function to get period interval (local to this component)
const getPeriodInterval = (currentPeriod: FilterPeriod, now: Date, isAdjustingComparisons: boolean) => {
  let start: Date;
  let end: Date;

  switch (currentPeriod) {
    case "today":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "7days":
      start = startOfDay(subDays(now, 6));
      end = endOfDay(now);
      break;
    case "30days":
      start = startOfDay(subDays(now, 29));
      end = endOfDay(now);
      break;
    case "60days":
      start = startOfDay(subDays(now, 59));
      end = endOfDay(now);
      break;
    case "12months":
      start = startOfDay(subMonths(now, 11));
      end = endOfDay(now);
      break;
    case "week":
      start = startOfWeek(now, { weekStartsOn: 0, locale: ptBR });
      end = endOfWeek(now, { weekStartsOn: 0, locale: ptBR });
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "week", now);
      }
      break;
    case "month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "month", now);
      }
      break;
    case "year":
      start = startOfYear(now);
      end = endOfYear(now);
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "year", now);
      }
      break;
    case "all":
      // This case is handled specifically in processDataForChart based on actual data
      return { start: new Date(0), end: now }; // Placeholder
    default:
      return { start: now, end: now };
  }
  return { start, end };
};

interface RegistrationTrendChartProps {
  data: Contact[]; // Now receives already filtered and combined data
  selectedPeriod: FilterPeriod;
  isAdjustingComparisons: boolean;
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({
  data: filteredData, // Renamed to filteredData for clarity
  selectedPeriod,
  isAdjustingComparisons,
}) => {
  const processDataForChart = (
    items: Contact[],
    selectedPeriod: FilterPeriod,
    isAdjustingComparisons: boolean
  ) => {
    const now = new Date();

    // 1. Determine the actual min and max dates from the provided items
    let minDataDate: Date | null = null;
    let maxDataDate: Date | null = null;

    if (items.length > 0) {
      items.forEach(item => {
        const dateString = item.datacontactolead || item.dataregisto;
        if (dateString) {
          const itemDate = parseISO(dateString);
          if (!isNaN(itemDate.getTime())) {
            if (minDataDate === null || isBefore(itemDate, minDataDate)) {
              minDataDate = itemDate;
            }
            if (maxDataDate === null || isAfter(itemDate, maxDataDate)) {
              maxDataDate = itemDate;
            }
          }
        }
      });
    }

    // If no valid dates in the filtered data, return empty
    if (!minDataDate || !maxDataDate) {
      return { chartData: [], groupUnit: 'day' };
    }

    // 2. Determine the chart's interval (start and end dates for the chart)
    let intervalStart: Date;
    let intervalEnd: Date;

    if (selectedPeriod === "all") {
      intervalStart = startOfMonth(minDataDate); // Start from the beginning of the month of the earliest contact
      intervalEnd = endOfDay(now); // End at the end of today
    } else {
      const { start, end } = getPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
      intervalStart = start;
      intervalEnd = end;
    }

    // 3. Determine the grouping unit based on the selected period and interval duration
    let groupUnit: 'day' | 'month' | 'year';
    if (selectedPeriod === "today" || selectedPeriod === "7days" || selectedPeriod === "week" || selectedPeriod === "month" || selectedPeriod === "30days" || selectedPeriod === "60days") {
      groupUnit = 'day';
    } else if (selectedPeriod === "year" || selectedPeriod === "12months") {
      groupUnit = 'month';
    } else { // "all"
      const diffInYears = differenceInYears(intervalEnd, intervalStart);
      if (diffInYears >= 2) { // If range is 2 years or more, group by year
        groupUnit = 'year';
      } else { // Otherwise, group by month
        groupUnit = 'month';
      }
    }

    // 4. Generate the date range for the chart's X-axis
    const generateDateRange = (start: Date, end: Date, unit: 'day' | 'month' | 'year') => {
      const dates: Date[] = [];
      let currentDate = start;

      while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
        dates.push(currentDate);
        if (unit === 'day') {
          currentDate = addDays(currentDate, 1);
        } else if (unit === 'month') {
          currentDate = addMonths(currentDate, 1);
        } else if (unit === 'year') {
          currentDate = addYears(currentDate, 1);
        }
      }
      return dates;
    };

    const dateRange = generateDateRange(intervalStart, intervalEnd, groupUnit);

    // 5. Initialize data map for chart
    const dateMap: { [key: string]: { date: Date; count: number; formattedDate: string } } = {};
    dateRange.forEach(date => {
      let key: string;
      if (groupUnit === 'day') {
        key = format(date, 'yyyy-MM-dd');
      } else if (groupUnit === 'month') {
        key = format(startOfMonth(date), 'yyyy-MM-dd');
      } else { // year
        key = format(startOfYear(date), 'yyyy-MM-dd');
      }
      dateMap[key] = { date, count: 0, formattedDate: formatDateLabel(date, groupUnit) };
    });

    // 6. Populate data map with actual counts
    items.forEach(item => {
      const dateString = item.datacontactolead || item.dataregisto;
      if (dateString) {
        const itemDate = parseISO(dateString);
        if (!isNaN(itemDate.getTime())) {
          let key: string;
          let dateToGroup = itemDate;

          if (groupUnit === 'day') {
            key = format(dateToGroup, 'yyyy-MM-dd');
          } else if (groupUnit === 'month') {
            dateToGroup = startOfMonth(dateToGroup);
            key = format(dateToGroup, 'yyyy-MM-dd');
          } else { // year
            dateToGroup = startOfYear(dateToGroup);
            key = format(dateToGroup, 'yyyy-MM-dd');
          }

          if (dateMap[key]) {
            dateMap[key].count++;
          }
        }
      }
    });

    // 7. Convert map to array and sort by date
    const chartData = Object.values(dateMap).sort((a, b) => a.date.getTime() - b.date.getTime());

    return { chartData, groupUnit };
  };

  const formatDateLabel = (date: Date, groupUnit: 'day' | 'month' | 'year') => {
    if (groupUnit === 'day') {
      return format(date, 'dd/MM', { locale: ptBR });
    } else if (groupUnit === 'month') {
      return format(date, 'MMM yyyy', { locale: ptBR });
    } else if (groupUnit === 'year') {
      return format(date, 'yyyy', { locale: ptBR });
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR }); // Fallback
  };

  const { chartData, groupUnit } = useMemo(() => {
    return processDataForChart(filteredData, selectedPeriod, isAdjustingComparisons);
  }, [filteredData, selectedPeriod, isAdjustingComparisons]);

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