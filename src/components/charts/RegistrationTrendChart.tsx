"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contact } from '@/types/contact';
import {
  format, parseISO, isSameDay, isSameWeek, isSameMonth, isSameYear,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval,
  subDays, subWeeks, subMonths, subYears,
  isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrationTrendChartProps {
  allContacts: Contact[];
  allLeads: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months";
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({ allContacts, allLeads, selectedPeriod }) => {

  const getIntervalAndFormat = (period: string, now: Date) => {
    let intervalStart: Date;
    let intervalEnd: Date;
    let dateFormat: string;
    let tickInterval: 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | 'equidistant' | number = 'equidistant';

    switch (period) {
      case "today":
        intervalStart = startOfDay(now);
        intervalEnd = endOfDay(now);
        dateFormat = 'HH:mm';
        break;
      case "7days":
        intervalStart = subDays(now, 6);
        intervalEnd = now;
        dateFormat = 'dd/MM';
        break;
      case "30days":
        intervalStart = subDays(now, 29);
        intervalEnd = now;
        dateFormat = 'dd/MM';
        break;
      case "60days":
        intervalStart = subDays(now, 59);
        intervalEnd = now;
        dateFormat = 'dd/MM';
        break;
      case "12months":
        intervalStart = subMonths(now, 11);
        intervalEnd = now;
        dateFormat = 'MMM yy';
        break;
      case "week":
        intervalStart = startOfWeek(now, { weekStartsOn: 0, locale: ptBR });
        intervalEnd = endOfWeek(now, { weekStartsOn: 0, locale: ptBR });
        dateFormat = 'EEE';
        break;
      case "month":
        intervalStart = startOfMonth(now);
        intervalEnd = endOfMonth(now);
        dateFormat = 'dd/MM';
        break;
      case "year":
        intervalStart = startOfYear(now);
        intervalEnd = endOfYear(now);
        dateFormat = 'MMM';
        break;
      case "all":
        // Find the earliest date among all contacts and leads
        const allDates = [
          ...allContacts.map(c => c.dataregisto && typeof c.dataregisto === 'string' ? parseISO(c.dataregisto).getTime() : Infinity),
          ...allLeads.map(l => {
            const dateString = l.datacontactolead || l.dataregisto;
            return dateString && typeof dateString === 'string' ? parseISO(dateString).getTime() : Infinity;
          })
        ].filter(time => time !== Infinity && !isNaN(time)); // Filter out NaN from invalid dates

        intervalStart = allDates.length > 0 ? new Date(Math.min(...allDates)) : now;
        intervalEnd = now;
        dateFormat = 'MMM yy';
        tickInterval = 'preserveStartEnd';
        break;
      default:
        intervalStart = startOfDay(now);
        intervalEnd = endOfDay(now);
        dateFormat = 'HH:mm';
    }
    return { intervalStart, intervalEnd, dateFormat, tickInterval };
  };

  const chartData = React.useMemo(() => {
    const now = new Date();
    const { intervalStart, intervalEnd, dateFormat } = getIntervalAndFormat(selectedPeriod, now);

    const allItems = [
      ...allContacts.flatMap(c => {
        if (c.dataregisto && typeof c.dataregisto === 'string') {
          const parsedDate = parseISO(c.dataregisto);
          if (!isNaN(parsedDate.getTime())) {
            return [{ date: parsedDate, type: 'contact' }];
          }
        }
        return [];
      }),
      ...allLeads.flatMap(l => {
        const dateString = l.datacontactolead || l.dataregisto;
        if (dateString && typeof dateString === 'string') {
          const parsedDate = parseISO(dateString);
          if (!isNaN(parsedDate.getTime())) {
            return [{ date: parsedDate, type: 'lead' }];
          }
        }
        return [];
      }),
    ].filter(item => isWithinInterval(item.date, { start: intervalStart, end: intervalEnd }));

    let dates: Date[] = [];
    switch (selectedPeriod) {
      case "today":
        dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "7days":
      case "30days":
      case "60days":
        dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "12months":
        dates = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "week":
        dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "month":
        dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "year":
        dates = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
        break;
      case "all":
        const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);
        if (spanInDays <= 60) {
          dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        } else if (spanInDays <= 365 * 2) {
          dates = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
        } else {
          dates = eachYearOfInterval({ start: intervalStart, end: intervalEnd });
        }
        break;
      default:
        dates = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    }

    const dataMap = new Map<string, { date: Date; contacts: number; leads: number }>();

    dates.forEach(date => {
      let key: string;
      if (selectedPeriod === "today" || selectedPeriod === "7days" || selectedPeriod === "30days" || selectedPeriod === "60days" || selectedPeriod === "week" || selectedPeriod === "month") {
        key = format(date, 'yyyy-MM-dd');
      } else if (selectedPeriod === "12months" || selectedPeriod === "year") {
        key = format(date, 'yyyy-MM');
      } else if (selectedPeriod === "all") {
        const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);
        if (spanInDays <= 60) {
          key = format(date, 'yyyy-MM-dd');
        } else if (spanInDays <= 365 * 2) {
          key = format(date, 'yyyy-MM');
        } else {
          key = format(date, 'yyyy');
        }
      } else {
        key = format(date, 'yyyy-MM-dd');
      }
      dataMap.set(key, { date: date, contacts: 0, leads: 0 });
    });

    allItems.forEach(item => {
      let key: string;
      if (selectedPeriod === "today" || selectedPeriod === "7days" || selectedPeriod === "30days" || selectedPeriod === "60days" || selectedPeriod === "week" || selectedPeriod === "month") {
        key = format(item.date, 'yyyy-MM-dd');
      } else if (selectedPeriod === "12months" || selectedPeriod === "year") {
        key = format(item.date, 'yyyy-MM');
      } else if (selectedPeriod === "all") {
        const spanInDays = (intervalEnd.getTime() - intervalStart.getTime()) / (1000 * 60 * 60 * 24);
        if (spanInDays <= 60) {
          key = format(item.date, 'yyyy-MM-dd');
        } else if (spanInDays <= 365 * 2) {
          key = format(item.date, 'yyyy-MM');
        } else {
          key = format(item.date, 'yyyy');
        }
      } else {
        key = format(item.date, 'yyyy-MM-dd');
      }

      if (dataMap.has(key)) {
        const entry = dataMap.get(key)!;
        if (item.type === 'contact') {
          entry.contacts += 1;
        } else if (item.type === 'lead') {
          entry.leads += 1;
        }
        dataMap.set(key, entry);
      }
    });

    const sortedData = Array.from(dataMap.values()).sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    return sortedData;
  }, [allContacts, allLeads, selectedPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const contacts = payload.find((p: any) => p.dataKey === "contacts");
      const leads = payload.find((p: any) => p.dataKey === "leads");

      // The label here is the raw Date object from dataKey="date"
      const formattedLabel = format(label, getIntervalAndFormat(selectedPeriod, new Date()).dateFormat, { locale: ptBR });

      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="text-sm font-bold text-foreground">{formattedLabel}</div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Contactos: <span className="font-bold text-foreground">{contacts ? contacts.value : 0}</span></span>
            <span className="text-[0.70rem] uppercase text-muted-foreground">Leads: <span className="font-bold text-foreground">{leads ? leads.value : 0}</span></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const { dateFormat, tickInterval } = getIntervalAndFormat(selectedPeriod, new Date());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tendência de Registos</CardTitle>
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
                dataKey="date" // Agora usa o objeto Date diretamente
                tickFormatter={(value: Date) => format(value, dateFormat, { locale: ptBR })} // Formata o objeto Date
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
                  if (value === 'contacts') return 'Contactos';
                  if (value === 'leads') return 'Leads';
                  return value;
                }}
              />
              <Line type="monotone" dataKey="contacts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--green-500))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
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