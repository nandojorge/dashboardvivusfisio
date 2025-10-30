"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Contact } from '@/types/contact';
import {
  format, parseISO, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval,
  isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subWeeks, subYears
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months" | "custom";

interface ConversionTrendLineChartProps {
  allLeads: Contact[];
  selectedPeriod: FilterPeriod;
  dateRange: { from?: Date; to?: Date };
}

// Define um tipo para os valores válidos de interval do Recharts XAxis
type RechartsAxisInterval = 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | number;

const ConversionTrendLineChart: React.FC<ConversionTrendLineChartProps> = ({
  allLeads,
  selectedPeriod,
  dateRange,
}) => {

  const getIntervalAndFormat = (period: FilterPeriod, now: Date, range?: { from?: Date; to?: Date }) => {
    let intervalStart: Date;
    let intervalEnd: Date;
    let dateFormat: string;
    let tickInterval: RechartsAxisInterval; // Removed initial assignment here

    if (period === "custom" && range?.from && range?.to) {
      intervalStart = range.from;
      intervalEnd = range.to;
      tickInterval = 'preserveStartEnd';
    } else {
      switch (period) {
        case "today":
          intervalStart = startOfDay(now);
          intervalEnd = endOfDay(now);
          dateFormat = 'EEE';
          tickInterval = 'preserveStartEnd';
          break;
        case "7days":
          intervalStart = subDays(now, 6);
          intervalEnd = now;
          dateFormat = 'dd/MM';
          tickInterval = 'preserveStartEnd';
          break;
        case "30days":
          intervalStart = subDays(now, 29);
          intervalEnd = now;
          dateFormat = 'dd/MM';
          tickInterval = 'preserveStartEnd';
          break;
        case "60days":
          intervalStart = subDays(now, 59);
          intervalEnd = now;
          dateFormat = 'dd/MM';
          tickInterval = 'preserveStartEnd';
          break;
        case "12months":
          intervalStart = subMonths(now, 11);
          intervalEnd = now;
          dateFormat = 'MMM yy';
          tickInterval = 'preserveStartEnd';
          break;
        case "week":
          intervalStart = startOfWeek(now, { weekStartsOn: 0, locale: ptBR });
          intervalEnd = endOfWeek(now, { weekStartsOn: 0, locale: ptBR });
          dateFormat = 'EEE';
          tickInterval = 'preserveStartEnd';
          break;
        case "month":
          intervalStart = startOfMonth(now);
          intervalEnd = endOfMonth(now);
          dateFormat = 'dd/MM';
          tickInterval = 'preserveStartEnd';
          break;
        case "year":
          intervalStart = startOfYear(now);
          intervalEnd = endOfYear(now);
          dateFormat = 'MMM';
          tickInterval = 'preserveStartEnd';
          break;
        case "all":
          const allDates = allLeads.map(l => l.datacontactolead && typeof l.datacontactolead === 'string' ? parseISO(l.datacontactolead).getTime() : Infinity)
                                          .filter(time => time !== Infinity && !isNaN(time));
          intervalStart = allDates.length > 0 ? new Date(Math.min(...allDates)) : now;
          intervalEnd = now;
          dateFormat = 'MMM yy';
          tickInterval = 'preserveStartEnd';
          break;
        default:
          intervalStart = startOfDay(now);
          intervalEnd = endOfDay(now);
          dateFormat = 'HH:mm';
          tickInterval = 'preserveStartEnd';
      }
    }

    const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);

    if (spanInDays <= 7) {
      dateFormat = 'EEE'; // Mon, Tue
    } else if (spanInDays <= 60) {
      dateFormat = 'dd/MM'; // 01/01
    } else if (spanInDays <= 365 * 2) {
      dateFormat = 'MMM yy'; // Jan 23
    } else {
      dateFormat = 'yyyy'; // 2023
    }

    return { intervalStart, intervalEnd, dateFormat, tickInterval };
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const { intervalStart, intervalEnd, dateFormat } = getIntervalAndFormat(selectedPeriod, now, dateRange);

    const convertedLeads = allLeads.filter(lead =>
      lead.conversao === "Lead Convertida" &&
      lead.datacontactolead && typeof lead.datacontactolead === 'string'
    ).map(lead => ({
      ...lead,
      parsedDate: parseISO(lead.datacontactolead as string)
    })).filter(lead =>
      !isNaN(lead.parsedDate.getTime()) &&
      isWithinInterval(lead.parsedDate, { start: intervalStart, end: intervalEnd })
    );

    let dates: Date[] = [];
    const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);

    if (spanInDays <= 60) { // Daily for up to 2 months
      dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    } else if (spanInDays <= 365 * 2) { // Monthly for up to 2 years
      dates = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
    } else { // Yearly for longer periods
      dates = eachYearOfInterval({ start: intervalStart, end: intervalEnd });
    }

    const dataMap = new Map<string, { date: Date; convertedLeads: number }>();

    dates.forEach(date => {
      let key: string;
      if (spanInDays <= 60) {
        key = format(date, 'yyyy-MM-dd');
      } else if (spanInDays <= 365 * 2) {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy');
      }
      dataMap.set(key, { date: date, convertedLeads: 0 });
    });

    convertedLeads.forEach(item => {
      const itemDate = item.parsedDate;
      let key: string;
      if (spanInDays <= 60) {
        key = format(itemDate, 'yyyy-MM-dd');
      } else if (spanInDays <= 365 * 2) {
        key = format(itemDate, 'yyyy-MM');
      } else {
        key = format(itemDate, 'yyyy');
      }

      if (dataMap.has(key)) {
        const entry = dataMap.get(key)!;
        entry.convertedLeads += 1;
        dataMap.set(key, entry);
      }
    });

    const sortedData = Array.from(dataMap.values()).sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    return sortedData;
  }, [allLeads, selectedPeriod, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const convertedLeads = payload.find((p: any) => p.dataKey === "convertedLeads");
      const formattedLabel = format(label, getIntervalAndFormat(selectedPeriod, new Date(), dateRange).dateFormat, { locale: ptBR });

      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="text-sm font-bold text-foreground">{formattedLabel}</div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Leads Convertidas: <span className="font-bold text-foreground">{convertedLeads ? convertedLeads.value : 0}</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const { dateFormat, tickInterval } = getIntervalAndFormat(selectedPeriod, new Date(), dateRange);

  return (
    <Card className="w-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Tendência de Conversão de Leads</CardTitle>
        <CardDescription>Número de leads convertidas ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: Date) => format(value, dateFormat, { locale: ptBR })}
                tickLine={false}
                axisLine={false}
                className="text-xs"
                interval={tickInterval}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => {
                  if (value === 'convertedLeads') return 'Leads Convertidas';
                  return value;
                }}
              />
              <Line type="monotone" dataKey="convertedLeads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
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

export { ConversionTrendLineChart };