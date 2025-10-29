"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contact } from '@/types/contact';

interface RegistrationTrendChartProps {
  registrations: Contact[];
  selectedPeriod: "today" | "7days" | "30days" | "60days" | "12months" | "all";
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({ registrations, selectedPeriod }) => {
  const chartData = React.useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today

    const formatKey = (date: Date, period: string) => {
      if (period === "12months" || period === "all") {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
      }
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const getNextDate = (currentDate: Date, period: string) => {
      if (period === "12months" || period === "all") {
        return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    };

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case "7days":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        break;
      case "30days":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        break;
      case "60days":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
        break;
      case "12months":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1, 0, 0, 0, 0); // Start of month 12 months ago
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
        break;
      case "all":
      default:
        const earliestDate = registrations.reduce((minDate, reg) => {
          const regDate = new Date(reg.createdAt);
          return regDate < minDate ? regDate : minDate;
        }, now);
        startDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1, 0, 0, 0, 0); // Start of earliest month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
        break;
    }

    const countsMap: { [key: string]: { contactsCount: number; leadsCount: number } } = {};

    registrations.forEach(reg => {
      const regDate = new Date(reg.createdAt);
      if (regDate >= startDate && regDate <= endDate) {
        const key = formatKey(regDate, selectedPeriod);
        if (!countsMap[key]) {
          countsMap[key] = { contactsCount: 0, leadsCount: 0 };
        }
        if (reg.isLead) {
          countsMap[key].leadsCount++;
        } else {
          countsMap[key].contactsCount++;
        }
      }
    });

    const dataPoints = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const key = formatKey(currentDate, selectedPeriod);
      dataPoints.push({
        date: key,
        contactsCount: countsMap[key]?.contactsCount || 0,
        leadsCount: countsMap[key]?.leadsCount || 0,
      });
      currentDate = getNextDate(currentDate, selectedPeriod);
    }

    return dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [registrations, selectedPeriod]);

  return (
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
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (selectedPeriod === "12months" || selectedPeriod === "all") {
                  const [year, month] = value.split('-');
                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
                }
                return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
              }}
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
                  const dateLabel = selectedPeriod === "12months" || selectedPeriod === "all"
                    ? new Date(label).toLocaleString('pt-PT', { month: 'long', year: 'numeric' })
                    : new Date(label).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

                  return (
                    <div className="rounded-lg border bg-card p-2 shadow-sm">
                      <div className="text-sm font-bold text-foreground">{dateLabel}</div>
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">{entry.name}</span>
                          <span className="font-bold text-foreground" style={{ color: entry.color }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value: string) => {
                if (value === 'contactsCount') return <span className="text-black">Contactos</span>;
                if (value === 'leadsCount') return <span className="text-black">Leads</span>;
                return <span className="text-black">{value}</span>;
              }}
            />
            <Line
              type="monotone"
              dataKey="contactsCount"
              name="Contactos"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="leadsCount"
              name="Leads"
              stroke="#82ca9d" // Custom green color for leads
              strokeWidth={2}
              dot={{ fill: "#82ca9d", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Nenhum registo para exibir neste período.
        </div>
      )}
    </CardContent>
  );
};

export default RegistrationTrendChart;