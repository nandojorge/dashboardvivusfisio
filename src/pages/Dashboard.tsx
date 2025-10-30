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

type FilterPeriod = "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months" | "custom";

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Contact[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("30days");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    // Mock data fetching
    const fetchMockData = () => {
      const mockContacts: Contact[] = [
        { id: "1", nome: "João Silva", email: "joao@example.com", telefone: "912345678", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2023, 10, 15), ativo: true },
        { id: "2", nome: "Maria Santos", email: "maria@example.com", telefone: "934567890", origemcontacto: "Redes Sociais", concelho: "Porto", servico: null, dataContacto: new Date(2023, 10, 20), ativo: true },
        { id: "3", nome: "Pedro Almeida", email: "pedro@example.com", telefone: "967890123", origemcontacto: "Referência", concelho: "Coimbra", servico: null, dataContacto: new Date(2023, 11, 1), ativo: false },
        { id: "4", nome: "Ana Costa", email: "ana@example.com", telefone: "921098765", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2023, 11, 5), ativo: true },
        { id: "5", nome: "Carlos Pereira", email: "carlos@example.com", telefone: "911223344", origemcontacto: "Email Marketing", concelho: "Faro", servico: null, dataContacto: new Date(2024, 0, 1), ativo: true },
        { id: "6", nome: "Sofia Rodrigues", email: "sofia@example.com", telefone: "933445566", origemcontacto: "Redes Sociais", concelho: "Porto", servico: null, dataContacto: new Date(2024, 0, 10), ativo: true },
        { id: "7", nome: "Miguel Fernandes", email: "miguel@example.com", telefone: "966778899", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 0, 12), ativo: false },
        { id: "8", nome: "Laura Gomes", email: "laura@example.com", telefone: "922334455", origemcontacto: "Referência", concelho: "Braga", servico: null, dataContacto: new Date(2024, 1, 1), ativo: true },
        { id: "9", nome: "Tiago Martins", email: "tiago@example.com", telefone: "910011223", origemcontacto: "Email Marketing", concelho: "Coimbra", servico: null, dataContacto: new Date(2024, 1, 15), ativo: true },
        { id: "10", nome: "Inês Ribeiro", email: "ines@example.com", telefone: "930033445", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 1, 20), ativo: true },
        { id: "11", nome: "Rui Santos", email: "rui@example.com", telefone: "912345670", origemcontacto: "Website", concelho: "Porto", servico: null, dataContacto: new Date(2024, 2, 1), ativo: true },
        { id: "12", nome: "Marta Costa", email: "marta@example.com", telefone: "934567891", origemcontacto: "Redes Sociais", concelho: "Faro", servico: null, dataContacto: new Date(2024, 2, 5), ativo: true },
        { id: "13", nome: "Nuno Pereira", email: "nuno@example.com", telefone: "967890124", origemcontacto: "Referência", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 2, 10), ativo: false },
        { id: "14", nome: "Patrícia Almeida", email: "patricia@example.com", telefone: "921098766", origemcontacto: "Email Marketing", concelho: "Coimbra", servico: null, dataContacto: new Date(2024, 2, 15), ativo: true },
        { id: "15", nome: "Vasco Silva", email: "vasco@example.com", telefone: "911223345", origemcontacto: "Website", concelho: "Porto", servico: null, dataContacto: new Date(2024, 2, 20), ativo: true },
        { id: "16", nome: "Diana Rodrigues", email: "diana@example.com", telefone: "933445567", origemcontacto: "Redes Sociais", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 2, 25), ativo: true },
        { id: "17", nome: "André Fernandes", email: "andre@example.com", telefone: "966778800", origemcontacto: "Website", concelho: "Braga", servico: null, dataContacto: new Date(2024, 2, 28), ativo: false },
        { id: "18", nome: "Mariana Gomes", email: "mariana@example.com", telefone: "922334456", origemcontacto: "Referência", concelho: "Faro", servico: null, dataContacto: new Date(2024, 3, 1), ativo: true },
        { id: "19", nome: "Filipe Martins", email: "filipe@example.com", telefone: "910011224", origemcontacto: "Email Marketing", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 3, 5), ativo: true },
        { id: "20", nome: "Beatriz Ribeiro", email: "beatriz@example.com", telefone: "930033446", origemcontacto: "Website", concelho: "Porto", servico: null, dataContacto: new Date(2024, 3, 10), ativo: true },
        { id: "21", nome: "Ricardo Silva", email: "ricardo@example.com", telefone: "912345671", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 3, 15), ativo: true },
        { id: "22", nome: "Joana Santos", email: "joana@example.com", telefone: "934567892", origemcontacto: "Redes Sociais", concelho: "Coimbra", servico: null, dataContacto: new Date(2024, 3, 20), ativo: true },
        { id: "23", nome: "Luís Almeida", email: "luis@example.com", telefone: "967890125", origemcontacto: "Referência", concelho: "Porto", servico: null, dataContacto: new Date(2024, 3, 25), ativo: false },
        { id: "24", nome: "Catarina Costa", email: "catarina@example.com", telefone: "921098767", origemcontacto: "Email Marketing", concelho: "Faro", servico: null, dataContacto: new Date(2024, 3, 30), ativo: true },
        { id: "25", nome: "Manuel Pereira", email: "manuel@example.com", telefone: "911223346", origemcontacto: "Website", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 4, 1), ativo: true },
        { id: "26", nome: "Filipa Rodrigues", email: "filipa@example.com", telefone: "933445568", origemcontacto: "Redes Sociais", concelho: "Braga", servico: null, dataContacto: new Date(2024, 4, 5), ativo: true },
        { id: "27", nome: "Gonçalo Fernandes", email: "goncalo@example.com", telefone: "966778801", origemcontacto: "Website", concelho: "Coimbra", servico: null, dataContacto: new Date(2024, 4, 10), ativo: false },
        { id: "28", nome: "Sofia Gomes", email: "sofia.g@example.com", telefone: "922334457", origemcontacto: "Referência", concelho: "Porto", servico: null, dataContacto: new Date(2024, 4, 15), ativo: true },
        { id: "29", nome: "Diogo Martins", email: "diogo@example.com", telefone: "910011225", origemcontacto: "Email Marketing", concelho: "Lisboa", servico: null, dataContacto: new Date(2024, 4, 20), ativo: true },
        { id: "30", nome: "Carolina Ribeiro", email: "carolina@example.com", telefone: "930033447", origemcontacto: "Website", concelho: "Faro", servico: null, dataContacto: new Date(2024, 4, 25), ativo: true },
      ];

      const mockLeads: Contact[] = [
        { id: "L1", nome: "Lead 1", email: "lead1@example.com", telefone: "910000001", origemcontacto: "Website", concelho: "Lisboa", servico: "Consultoria", dataContacto: new Date(2024, 3, 1), ativo: true },
        { id: "L2", nome: "Lead 2", email: "lead2@example.com", telefone: "910000002", origemcontacto: "Redes Sociais", concelho: "Porto", servico: "Design", dataContacto: new Date(2024, 3, 5), ativo: true },
        { id: "L3", nome: "Lead 3", email: "lead3@example.com", telefone: "910000003", origemcontacto: "Referência", concelho: "Coimbra", servico: "Desenvolvimento", dataContacto: new Date(2024, 3, 10), ativo: true },
        { id: "L4", nome: "Lead 4", email: "lead4@example.com", telefone: "910000004", origemcontacto: "Website", concelho: "Lisboa", servico: "Consultoria", dataContacto: new Date(2024, 3, 15), ativo: true },
        { id: "L5", nome: "Lead 5", email: "lead5@example.com", telefone: "910000005", origemcontacto: "Email Marketing", concelho: "Faro", servico: "Design", dataContacto: new Date(2024, 3, 20), ativo: true },
        { id: "L6", nome: "Lead 6", email: "lead6@example.com", telefone: "910000006", origemcontacto: "Redes Sociais", concelho: "Porto", servico: "Consultoria", dataContacto: new Date(2024, 4, 1), ativo: true },
        { id: "L7", nome: "Lead 7", email: "lead7@example.com", telefone: "910000007", origemcontacto: "Website", concelho: "Lisboa", servico: "Desenvolvimento", dataContacto: new Date(2024, 4, 5), ativo: true },
        { id: "L8", nome: "Lead 8", email: "lead8@example.com", telefone: "910000008", origemcontacto: "Referência", concelho: "Braga", servico: "Consultoria", dataContacto: new Date(2024, 4, 10), ativo: true },
        { id: "L9", nome: "Lead 9", email: "lead9@example.com", telefone: "910000009", origemcontacto: "Email Marketing", concelho: "Coimbra", servico: "Design", dataContacto: new Date(2024, 4, 15), ativo: true },
        { id: "L10", nome: "Lead 10", email: "lead10@example.com", telefone: "910000010", origemcontacto: "Website", concelho: "Lisboa", servico: "Desenvolvimento", dataContacto: new Date(2024, 4, 20), ativo: true },
      ];

      setContacts(mockContacts);
      setLeads(mockLeads);
    };

    fetchMockData();
  }, []);

  const filterDataByPeriod = (data: Contact[], period: FilterPeriod, range?: { from?: Date; to?: Date }) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "today":
        startDate = subDays(now, 0);
        break;
      case "7days":
        startDate = subDays(now, 6);
        break;
      case "30days":
        startDate = subDays(now, 29);
        break;
      case "60days":
        startDate = subDays(now, 59);
        break;
      case "12months":
        startDate = subMonths(now, 11);
        break;
      case "week":
        startDate = subWeeks(now, 0);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week (Sunday)
        endDate = now;
        break;
      case "month":
        startDate = subMonths(now, 0);
        startDate.setDate(1); // Start of current month
        endDate = now;
        break;
      case "year":
        startDate = subYears(now, 0);
        startDate.setMonth(0, 1); // Start of current year
        endDate = now;
        break;
      case "all":
        return data;
      case "custom":
        if (range?.from && range?.to) {
          startDate = range.from;
          endDate = range.to;
        } else {
          return [];
        }
        break;
      default:
        return [];
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const itemDate = new Date(item.dataContacto);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const getPreviousPeriodRange = (period: FilterPeriod, currentRange: { from?: Date; to?: Date }) => {
    let prevFrom: Date | undefined;
    let prevTo: Date | undefined;

    if (!currentRange.from || !currentRange.to) return { from: undefined, to: undefined };

    const diffTime = Math.abs(currentRange.to.getTime() - currentRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (period) {
      case "today":
        prevFrom = subDays(currentRange.from, 1);
        prevTo = subDays(currentRange.to, 1);
        break;
      case "7days":
      case "30days":
      case "60days":
      case "12months":
        prevFrom = subDays(currentRange.from, diffDays);
        prevTo = subDays(currentRange.to, diffDays);
        break;
      case "week":
        prevFrom = subWeeks(currentRange.from, 1);
        prevTo = subWeeks(currentRange.to, 1);
        break;
      case "month":
        prevFrom = subMonths(currentRange.from, 1);
        prevTo = subMonths(currentRange.to, 1);
        break;
      case "year":
        prevFrom = subYears(currentRange.from, 1);
        prevTo = subYears(currentRange.to, 1);
        break;
      case "custom":
        prevFrom = subDays(currentRange.from, diffDays + 1); // +1 to account for inclusive range
        prevTo = subDays(currentRange.to, diffDays + 1);
        break;
      default:
        return { from: undefined, to: undefined };
    }

    return { from: prevFrom, to: prevTo };
  };

  const currentFilteredContacts = useMemo(() => filterDataByPeriod(contacts, selectedPeriod, dateRange), [contacts, selectedPeriod, dateRange]);
  const currentFilteredLeads = useMemo(() => filterDataByPeriod(leads, selectedPeriod, dateRange), [leads, selectedPeriod, dateRange]);

  const previousPeriodRange = useMemo(() => getPreviousPeriodRange(selectedPeriod, dateRange), [selectedPeriod, dateRange]);
  const previousFilteredContacts = useMemo(() => filterDataByPeriod(contacts, selectedPeriod, previousPeriodRange), [contacts, selectedPeriod, previousPeriodRange]);
  const previousFilteredLeads = useMemo(() => filterDataByPeriod(leads, selectedPeriod, previousPeriodRange), [leads, selectedPeriod, previousPeriodRange]);

  const totalContacts = currentFilteredContacts.length;
  const totalLeads = currentFilteredLeads.length;
  const activeContactsCount = currentFilteredContacts.filter(c => c.ativo).length;

  const previousTotalContacts = previousFilteredContacts.length;
  const previousTotalLeads = previousFilteredLeads.length;

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const contactsChange = calculatePercentageChange(totalContacts, previousTotalContacts);
  const leadsChange = calculatePercentageChange(totalLeads, previousTotalLeads);

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
          return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
        }
        return "Período Personalizado";
      default: return "Período Atual";
    }
  };

  const getPreviousPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today": return "Ontem";
      case "7days": return "7 Dias Anteriores";
      case "30days": return "30 Dias Anteriores";
      case "60days": return "60 Dias Anteriores";
      case "12months": return "12 Meses Anteriores";
      case "week": return "Semana Anterior";
      case "month": return "Mês Anterior";
      case "year": return "Ano Anterior";
      case "custom":
        if (previousPeriodRange.from && previousPeriodRange.to) {
          return `${format(previousPeriodRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(previousPeriodRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
        }
        return "Período Anterior Personalizado";
      default: return "Período Anterior";
    }
  };

  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    const now = new Date();
    let newFrom: Date | undefined;
    let newTo: Date | undefined = now;

    switch (period) {
      case "today":
        newFrom = subDays(now, 0);
        break;
      case "7days":
        newFrom = subDays(now, 6);
        break;
      case "30days":
        newFrom = subDays(now, 29);
        break;
      case "60days":
        newFrom = subDays(now, 59);
        break;
      case "12months":
        newFrom = subMonths(now, 11);
        break;
      case "week":
        newFrom = subWeeks(now, 0);
        newFrom.setDate(newFrom.getDate() - newFrom.getDay()); // Start of current week (Sunday)
        break;
      case "month":
        newFrom = subMonths(now, 0);
        newFrom.setDate(1); // Start of current month
        break;
      case "year":
        newFrom = subYears(now, 0);
        newFrom.setMonth(0, 1); // Start of current year
        break;
      case "all":
        newFrom = undefined;
        newTo = undefined;
        break;
      case "custom":
        // Keep current custom range or set a default if none exists
        if (!dateRange.from || !dateRange.to) {
          newFrom = subDays(now, 29);
          newTo = now;
        } else {
          newFrom = dateRange.from;
          newTo = dateRange.to;
        }
        break;
      default:
        newFrom = subDays(now, 29);
        break;
    }

    if (newFrom) newFrom.setHours(0, 0, 0, 0);
    if (newTo) newTo.setHours(23, 59, 59, 999);

    setDateRange({ from: newFrom, to: newTo });
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      setSelectedPeriod("custom");
    } else if (range?.from) {
      setDateRange({ from: range.from, to: range.from });
      setSelectedPeriod("custom");
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedPeriod === "today" ? "default" : "outline"}
            onClick={() => handlePeriodChange("today")}
          >
            Hoje
          </Button>
          <Button
            variant={selectedPeriod === "7days" ? "default" : "outline"}
            onClick={() => handlePeriodChange("7days")}
          >
            7 Dias
          </Button>
          <Button
            variant={selectedPeriod === "30days" ? "default" : "outline"}
            onClick={() => handlePeriodChange("30days")}
          >
            30 Dias
          </Button>
          <Button
            variant={selectedPeriod === "60days" ? "default" : "outline"}
            onClick={() => handlePeriodChange("60days")}
          >
            60 Dias
          </Button>
          <Button
            variant={selectedPeriod === "12months" ? "default" : "outline"}
            onClick={() => handlePeriodChange("12months")}
          >
            12 Meses
          </Button>
          <Button
            variant={selectedPeriod === "all" ? "default" : "outline"}
            onClick={() => handlePeriodChange("all")}
          >
            Total
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <path d="M22 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={cn(
                  contactsChange > 0 && "text-green-500",
                  contactsChange < 0 && "text-red-500",
                  contactsChange === 0 && "text-muted-foreground",
                  "flex items-center"
                )}>
                  {contactsChange > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                  {contactsChange < 0 && <TrendingDown className="h-3 w-3 mr-1" />}
                  {contactsChange.toFixed(1)}%
                </span>{" "}
                vs. {getPreviousPeriodLabel(selectedPeriod)}
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
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className={cn(
                  leadsChange > 0 && "text-green-500",
                  leadsChange < 0 && "text-red-500",
                  leadsChange === 0 && "text-muted-foreground",
                  "flex items-center"
                )}>
                  {leadsChange > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                  {leadsChange < 0 && <TrendingDown className="h-3 w-3 mr-1" />}
                  {leadsChange.toFixed(1)}%
                </span>{" "}
                vs. {getPreviousPeriodLabel(selectedPeriod)}
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
            {selectedPeriod !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-muted-foreground">
                  {/* No percentage change for active contacts for now */}
                </span>
              </p>
            )}
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
              <path d="M12 20h.01" />
              <path d="M18.01 20h.01" />
              <path d="M6.01 20h.01" />
              <path d="M12 4v16" />
              <path d="M3 10h18" />
              <path d="M19 4l-7 7-7-7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalContacts > 0 ? ((totalLeads / totalContacts) * 100).toFixed(1) : 0}%
            </div>
            {selectedPeriod !== "all" && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-muted-foreground">
                  {/* No percentage change for conversion rate for now */}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CombinedBarCharts
          currentContacts={currentFilteredContacts}
          previousContacts={previousFilteredContacts}
          currentLeads={currentFilteredLeads}
          previousLeads={previousFilteredLeads}
          selectedPeriod={selectedPeriod}
        />
        <PieChartComponent
          currentContacts={currentFilteredContacts}
          previousContacts={previousFilteredContacts}
          selectedPeriod={selectedPeriod}
        />
        <LineChartComponent
          currentContacts={currentFilteredContacts}
          previousContacts={previousFilteredContacts}
          selectedPeriod={selectedPeriod}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
};

export default Dashboard;