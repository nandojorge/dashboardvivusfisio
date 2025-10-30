"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Contact } from '@/types/contact';
import {
  format, parseISO,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval,
  subDays, subMonths,
  isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months" | "custom";

interface LineChartComponentProps {
  currentContacts: Contact[];
  previousContacts: Contact[];
  selectedPeriod: FilterPeriod;
  dateRange: { from?: Date; to?: Date };
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  currentContacts,
  previousContacts,
  selectedPeriod,
  dateRange,
}) => {

  const getIntervalAndFormat = (period: FilterPeriod, now: Date, range?: { from?: Date; to?: Date }) => {
    let intervalStart: Date;
    let intervalEnd: Date;
    let dateFormat: string;
    let tickInterval: 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | 'equidistant' | number = 'equidistant';

    if (period === "custom" && range?.from && range?.to) {
      intervalStart = range.from;
      intervalEnd = range.to;
    } else {
      switch (period) {
        case "today":
          intervalStart = startOfDay(now);
          intervalEnd = endOfDay(now);
          break;
        case "7days":
          intervalStart = subDays(now, 6);
          intervalEnd = now;
          break;
        case "30days":
          intervalStart = subDays(now, 29);
          intervalEnd = now;
          break;
        case "60days":
          intervalStart = subDays(now, 59);
          intervalEnd = now;
          break;
        case "12months":
          intervalStart = subMonths(now, 11);
          intervalEnd = now;
          break;
        case "week":
          intervalStart = startOfWeek(now, { weekStartsOn: 0, locale: ptBR });
          intervalEnd = endOfWeek(now, { weekStartsOn: 0, locale: ptBR });
          break;
        case "month":
          intervalStart = startOfMonth(now);
          intervalEnd = endOfMonth(now);
          break;
        case "year":
          intervalStart = startOfYear(now);
          intervalEnd = endOfYear(now);
          break;
        case "all":
          const allDates = [...currentContacts, ...previousContacts]
            .map(c => c.dataregisto && typeof c.dataregisto === 'string' ? parseISO(c.dataregisto).getTime() : Infinity)
            .filter(time => time !== Infinity && !isNaN(time));
          intervalStart = allDates.length > 0 ? new Date(Math.min(...allDates)) : now;
          intervalEnd = now;
          break;
        default:
          intervalStart = startOfDay(now);
          intervalEnd = endOfDay(now);
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

    const processItems = (items: Contact[], type: 'current' | 'previous') => {
      return items.flatMap(c => {
        if (c.dataregisto && typeof c.dataregisto === 'string') {
          const parsedDate = parseISO(c.dataregisto);
          if (!isNaN(parsedDate.getTime()) && isWithinInterval(parsedDate, { start: intervalStart, end: intervalEnd })) {
            return [{ date: parsedDate, type: type }];
          }
        }
        return [];
      });
    };

    const allItems = [
      ...processItems(currentContacts, 'current'),
      ...processItems(previousContacts, 'previous'),
    ];

    let dates: Date[] = [];
    const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);

    if (spanInDays <= 60) { // Daily for up to 2 months
      dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    } else if (spanInDays <= 365 * 2) { // Monthly for up to 2 years
      dates = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
    } else { // Yearly for longer periods
      dates = eachYearOfInterval({ start: intervalStart, end: intervalEnd });
    }

    const dataMap = new Map<string, { date: Date; currentContacts: number; previousContacts: number }>();

    dates.forEach(date => {
      let key: string;
      if (spanInDays <= 60) {
        key = format(date, 'yyyy-MM-dd');
      } else if (spanInDays <= 365 * 2) {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy');
      }
      dataMap.set(key, { date: date, currentContacts: 0, previousContacts: 0 });
    });

    allItems.forEach(item => {
      const itemDate = item.date;
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
        if (item.type === 'current') {
          entry.currentContacts += 1;
        } else if (item.type === 'previous') {
          entry.previousContacts += 1;
        }
        dataMap.set(key, entry);
      }
    });

    const sortedData = Array.from(dataMap.values()).sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    return sortedData;
  }, [currentContacts, previousContacts, selectedPeriod, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.dataKey === "currentContacts");
      const previous = payload.find((p: any) => p.dataKey === "previousContacts");

      const formattedLabel = format(label, getIntervalAndFormat(selectedPeriod, new Date(), dateRange).dateFormat, { locale: ptBR });

      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="text-sm font-bold text-foreground">{formattedLabel}</div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Contactos {getIntervalAndFormat(selectedPeriod, new Date(), dateRange).dateFormat === 'EEE' ? 'da Semana' : 'do Período Atual'}: <span className="font-bold text-foreground">{current ? current.value : 0}</span></span>
            {selectedPeriod !== "all" && (
              <span className="text-[0.70rem] uppercase text-muted-foreground">Contactos do Período Anterior: <span className="font-bold text-foreground">{previous ? previous.value : 0}</span></span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const { dateFormat, tickInterval } = getIntervalAndFormat(selectedPeriod, new Date(), dateRange);

  const getPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today": return "Hoje";
      case "7days": return "Últimos 7 Dias";
      case "30days": return "Últimos 30 Dias";
      case "60days": return "Últimos 60 Dias";
      case "12months": return "Últimos 12 Meses";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
      case "year": return "Este Ano";
      case "all": return "Total";
      case "custom": return "Período Personalizado";
      default: return "Período Atual";
    }
  };

  const getPreviousPeriodLabel = (period: FilterPeriod) => {
    if (period === "all") return "N/A";
    switch (period) {
      case "today": return "Ontem";
      case "7days": return "7 Dias Anteriores";
      case "30days": return "30 Dias Anteriores";
      case "60days": return "60 Dias Anteriores";
      case "12months": return "12 Meses Anteriores";
      case "week": return "Semana Anterior";
      case "month": return "Mês Anterior";
      case "year": return "Ano Anterior";
      case "custom": return "Período Anterior Personalizado";
      default: return "Período Anterior";
    }
  };

  // Custom Legend Component
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2 text-xs sm:text-sm">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <div className="h-3 w-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">
              {entry.dataKey === 'currentContacts' ? getPeriodLabel(selectedPeriod) : getPreviousPeriodLabel(selectedPeriod)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="w-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Tendência de Registos de Contactos</CardTitle>
        {selectedPeriod !== "all" && (
          <CardDescription>
            Comparação entre {getPeriodLabel(selectedPeriod)} e {getPreviousPeriodLabel(selectedPeriod)}
          </CardDescription>
        )}
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
                content={<CustomLegend selectedPeriod={selectedPeriod} />}
              />
              <Line type="monotone" dataKey="currentContacts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              {selectedPeriod !== "all" && (
                <Line type="monotone" dataKey="previousContacts" stroke="#decdad" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              )}
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

export { LineChartComponent };