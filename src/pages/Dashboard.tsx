"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Contact } from '@/types/contact';
import CombinedBarCharts from '@/components/charts/CombinedBarCharts';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { LineChartComponent } from '@/components/charts/LineChartComponent';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '@/components/data-table/columns';
import { showError } from '@/utils/toast'; // Importar showError do utilitário

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "custom" | "7days" | "30days" | "60days" | "12months";

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Contact[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("30days");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Contact[] = await response.json();
        setContacts(data);
        setLeads(data.filter(contact => contact.estado === 'Lead'));
      } catch (error) {
        console.error("Erro ao buscar contactos:", error);
        showError("Erro ao carregar os dados dos contactos."); // Usar showError
      }
    };

    fetchContacts();
  }, []);

  const filterContactsByPeriod = (
    allContacts: Contact[],
    period: FilterPeriod,
    customDateRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7days":
        startDate = subDays(now, 6); // Last 7 days including today
        break;
      case "30days":
        startDate = subDays(now, 29); // Last 30 days including today
        break;
      case "60days":
        startDate = subDays(now, 59); // Last 60 days including today
        break;
      case "12months":
        startDate = subMonths(now, 11); // Last 12 months including current
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - now.getDay())); // Start of current week (Sunday)
        endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6)); // End of current week (Saturday)
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "all":
        return allContacts;
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          startDate = customDateRange.from;
          endDate = customDateRange.to;
        } else {
          return [];
        }
        break;
      default:
        return [];
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return allContacts.filter(contact => {
      const contactDate = new Date(contact.dataCriacao);
      return contactDate >= startDate && contactDate <= endDate;
    });
  };

  const getPreviousPeriodDates = (period: FilterPeriod, currentFrom: Date | undefined, currentTo: Date | undefined) => {
    if (!currentFrom || !currentTo) return { from: undefined, to: undefined };

    const diffTime = Math.abs(currentTo.getTime() - currentFrom.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

    let prevFrom: Date;
    let prevTo: Date;

    switch (period) {
      case "today":
        prevFrom = subDays(currentFrom, 1);
        prevTo = subDays(currentTo, 1);
        break;
      case "7days":
        prevFrom = subDays(currentFrom, 7);
        prevTo = subDays(currentTo, 7);
        break;
      case "30days":
        prevFrom = subDays(currentFrom, 30);
        prevTo = subDays(currentTo, 30);
        break;
      case "60days":
        prevFrom = subDays(currentFrom, 60);
        prevTo = subDays(currentTo, 60);
        break;
      case "12months":
        prevFrom = subYears(currentFrom, 1);
        prevTo = subYears(currentTo, 1);
        break;
      case "week":
        prevFrom = subWeeks(currentFrom, 1);
        prevTo = subWeeks(currentTo, 1);
        break;
      case "month":
        prevFrom = subMonths(currentFrom, 1);
        prevTo = subMonths(currentTo, 1);
        break;
      case "year":
        prevFrom = subYears(currentFrom, 1);
        prevTo = subYears(currentTo, 1);
        break;
      case "custom":
        prevFrom = subDays(currentFrom, diffDays);
        prevTo = subDays(currentTo, diffDays);
        break;
      default:
        return { from: undefined, to: undefined };
    }
    return { from: prevFrom, to: prevTo };
  };

  const currentPeriodContacts = useMemo(() => {
    return filterContactsByPeriod(contacts, selectedPeriod, dateRange);
  }, [contacts, selectedPeriod, dateRange]);

  const currentPeriodLeads = useMemo(() => {
    return filterContactsByPeriod(leads, selectedPeriod, dateRange);
  }, [leads, selectedPeriod, dateRange]);

  const previousPeriodContacts = useMemo(() => {
    if (selectedPeriod === "all") return [];
    const { from, to } = getPreviousPeriodDates(selectedPeriod, dateRange.from, dateRange.to);
    return filterContactsByPeriod(contacts, "custom", { from, to });
  }, [contacts, selectedPeriod, dateRange]);

  const previousPeriodLeads = useMemo(() => {
    if (selectedPeriod === "all") return [];
    const { from, to } = getPreviousPeriodDates(selectedPeriod, dateRange.from, dateRange.to);
    return filterContactsByPeriod(leads, "custom", { from, to });
  }, [leads, selectedPeriod, dateRange]);

  const totalContacts = currentPeriodContacts.length;
  const totalLeads = currentPeriodLeads.length;
  const activeContactsCount = currentPeriodContacts.filter(c => c.estado === 'Ativo').length;

  const previousTotalContacts = previousPeriodContacts.length;
  const previousTotalLeads = previousPeriodLeads.length;

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const contactChange = getPercentageChange(totalContacts, previousTotalContacts);
  const leadChange = getPercentageChange(totalLeads, previousTotalLeads);

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      setSelectedPeriod("custom");
    } else {
      setDateRange({ from: undefined, to: undefined });
    }
    setCalendarOpen(false);
  };

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
      case "custom":
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, "dd MMM yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}`;
        }
        return "Período Personalizado";
      default: return "Selecionar Período";
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getPeriodLabel(selectedPeriod)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex flex-col p-2">
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("today"); setDateRange({ from: new Date(), to: new Date() }); setCalendarOpen(false); }}>Hoje</Button>
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("7days"); setDateRange({ from: subDays(new Date(), 6), to: new Date() }); setCalendarOpen(false); }}>Últimos 7 Dias</Button>
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("30days"); setDateRange({ from: subDays(new Date(), 29), to: new Date() }); setCalendarOpen(false); }}>Últimos 30 Dias</Button>
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("60days"); setDateRange({ from: subDays(new Date(), 59), to: new Date() }); setCalendarOpen(false); }}>Últimos 60 Dias</Button>
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("12months"); setDateRange({ from: subMonths(new Date(), 11), to: new Date() }); setCalendarOpen(false); }}>Últimos 12 Meses</Button>
                    <Button variant="ghost" onClick={() => { setSelectedPeriod("all"); setDateRange({ from: undefined, to: undefined }); setCalendarOpen(false); }}>Total</Button>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Contactos</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalContacts}</div>
                  {selectedPeriod !== "all" && (
                    <p className="flex items-center text-xs text-muted-foreground">
                      {contactChange > 0 && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                      {contactChange < 0 && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                      <span className={cn(
                        contactChange > 0 && "text-green-500",
                        contactChange < 0 && "text-red-500",
                        contactChange === 0 && "text-muted-foreground"
                      )}>
                        {contactChange.toFixed(1)}%
                      </span>
                      <span className="ml-1">vs. período anterior</span>
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalLeads}</div>
                  {selectedPeriod !== "all" && (
                    <p className="flex items-center text-xs text-muted-foreground">
                      {leadChange > 0 && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                      {leadChange < 0 && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                      <span className={cn(
                        leadChange > 0 && "text-green-500",
                        leadChange < 0 && "text-red-500",
                        leadChange === 0 && "text-muted-foreground"
                      )}>
                        {leadChange.toFixed(1)}%
                      </span>
                      <span className="ml-1">vs. período anterior</span>
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contactos Ativos</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeContactsCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalContacts > 0 ? ((totalLeads / totalContacts) * 100).toFixed(1) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
              <CombinedBarCharts
                currentContacts={currentPeriodContacts}
                previousContacts={previousPeriodContacts}
                currentLeads={currentPeriodLeads}
                previousLeads={previousPeriodLeads}
                selectedPeriod={selectedPeriod}
              />
              <PieChartComponent contacts={currentPeriodContacts} />
            </div>
            <LineChartComponent contacts={currentPeriodContacts} selectedPeriod={selectedPeriod} />
          </div>
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
            <Card>
              <CardHeader className="px-7">
                <CardTitle>Contactos Recentes</CardTitle>
                <CardDescription>
                  Os 10 contactos mais recentes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={contacts.slice(0, 10)} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;