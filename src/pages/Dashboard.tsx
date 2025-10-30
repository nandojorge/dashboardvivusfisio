"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts, getLeads } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown, UserPlus } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval,
  format, setDate, getDayOfYear, setDayOfYear, getDay, getDate,
  isBefore, isSameDay, addDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import RegistrationTrendChart from "@/components/charts/RegistrationTrendChart";
import CombinedBarCharts from "@/components/charts/CombinedBarCharts";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Helper function to get previous period interval, now considering adjustment
const getPreviousPeriodInterval = (currentPeriod: FilterPeriod, now: Date, isAdjustingComparisons: boolean) => {
  let start: Date;
  let end: Date;
  let previousPeriodStart: Date;

  switch (currentPeriod) {
    case "today":
      previousPeriodStart = subDays(now, 1);
      start = startOfDay(previousPeriodStart);
      end = endOfDay(previousPeriodStart);
      break;
    case "7days":
      start = startOfDay(subDays(now, 14));
      end = endOfDay(subDays(now, 8));
      break;
    case "30days":
      start = startOfDay(subDays(now, 60));
      end = endOfDay(subDays(now, 31));
      break;
    case "60days":
      start = startOfDay(subDays(now, 120));
      end = endOfDay(subDays(now, 61));
      break;
    case "12months":
      start = startOfDay(subMonths(now, 24));
      end = endOfDay(subMonths(now, 13));
      break;
    case "week":
      previousPeriodStart = subWeeks(now, 1);
      start = startOfWeek(previousPeriodStart, { weekStartsOn: 0, locale: ptBR });
      end = endOfWeek(previousPeriodStart, { weekStartsOn: 0, locale: ptBR });
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "week", now);
      }
      break;
    case "month":
      previousPeriodStart = subMonths(now, 1);
      start = startOfMonth(previousPeriodStart);
      end = endOfMonth(previousPeriodStart);
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "month", now);
      }
      break;
    case "year":
      previousPeriodStart = subYears(now, 1);
      start = startOfYear(previousPeriodStart);
      end = endOfYear(previousPeriodStart);
      if (isAdjustingComparisons) {
        end = getRealTimeCutoffDate(start, "year", now);
      }
      break;
    case "all":
      return { start: new Date(0), end: now };
    default:
      return { start: now, end: now };
  }
  return { start, end };
};

// Helper function to filter items (contacts/leads) by period
const getPeriodFilter = (itemDate: Date, period: FilterPeriod) => {
  const now = new Date();
  switch (period) {
    case "today":
      return isToday(itemDate);
    case "7days":
      const sevenDaysAgo = subDays(now, 6);
      return isWithinInterval(itemDate, { start: startOfDay(sevenDaysAgo), end: endOfDay(now) });
    case "30days":
      const thirtyDaysAgo = subDays(now, 29);
      return isWithinInterval(itemDate, { start: startOfDay(thirtyDaysAgo), end: endOfDay(now) });
    case "60days":
      const sixtyDaysAgo = subDays(now, 59);
      return isWithinInterval(itemDate, { start: startOfDay(sixtyDaysAgo), end: endOfDay(now) });
    case "12months":
      const twelveMonthsAgo = subMonths(now, 11);
      return isWithinInterval(itemDate, { start: startOfDay(twelveMonthsAgo), end: endOfDay(now) });
    case "week":
      return isThisWeek(itemDate, { weekStartsOn: 0, locale: ptBR });
    case "month":
      return isThisMonth(itemDate);
    case "year":
      return isThisYear(itemDate);
    case "all":
      return true;
    default:
      return false;
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");
  const [isAdjustingComparisons, setIsAdjustingComparisons] = useState(false);

  const { data: contactsData, isLoading: isLoadingContacts, isError: isErrorContacts, error: errorContacts } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const { data: leadsData, isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<Contact[], Error>({
    queryKey: ["leads"],
    queryFn: getLeads,
  });

  const isLoading = isLoadingContacts || isLoadingLeads;
  const isError = isErrorContacts || isErrorLeads;
  const error = errorContacts || errorLeads;

  const exampleCounties = ["Lisboa", "Porto", "Coimbra", "Faro", "Braga", "Aveiro"];

  // Helper function to filter and process items (contacts or leads)
  const filterAndProcessItems = (
    items: Contact[] | undefined,
    periodFilterFn: (itemDate: Date) => boolean,
    isLeadData: boolean = false
  ) => {
    if (!items) return [];
    return items.filter((item) => {
      let itemDateString: string | undefined;
      if (isLeadData && item.datacontactolead) {
        itemDateString = item.datacontactolead;
      } else if (item.dataregisto) {
        itemDateString = item.dataregisto;
      }

      if (!itemDateString || typeof itemDateString !== 'string') {
        return false;
      }
      const itemDate = parseISO(itemDateString);
      if (isNaN(itemDate.getTime())) {
        console.warn(`Invalid date string for item ${item.id}: ${itemDateString}`);
        return false;
      }
      return periodFilterFn(itemDate); // Only apply date filter
    }).map((item) => {
      // Ensure assignedOrigin always has a value, even if empty in source
      let assignedOrigin = item.origemcontacto && item.origemcontacto.trim() !== ''
        ? item.origemcontacto.toLowerCase()
        : "desconhecida"; // Assign "desconhecida" if empty or null

      let assignedCounty = item.concelho ? item.concelho : '';
      if (!assignedCounty) {
        assignedCounty = exampleCounties[Math.floor(Math.random() * exampleCounties.length)];
      }

      let assignedStatus = item.status;
      if (isLeadData) {
        const convertedStatuses = ["cliente", "ativo"];
        if (item.status && convertedStatuses.includes(item.status.toLowerCase())) {
          assignedStatus = item.status;
        } else {
          assignedStatus = "Lead";
        }
      }

      return {
        ...item,
        origemcontacto: assignedOrigin,
        concelho: assignedCounty,
        status: assignedStatus,
      };
    });
  };

  const filteredContacts = useMemo(() => {
    return filterAndProcessItems(contactsData, (contactDate) => getPeriodFilter(contactDate, selectedPeriod), false);
  }, [contactsData, selectedPeriod]);

  const filteredLeads = useMemo(() => {
    return filterAndProcessItems(leadsData, (leadDate) => getPeriodFilter(leadDate, selectedPeriod), true);
  }, [leadsData, selectedPeriod]);

  // Combine filtered contacts and leads for charts that need all data
  const combinedFilteredData = useMemo(() => {
    return [...filteredContacts, ...filteredLeads];
  }, [filteredContacts, filteredLeads]);

  const totalContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado?.toLowerCase() === "nao").length;
  }, [filteredContacts]);

  const newContactsCount = useMemo(() => {
    return filteredLeads.length;
  }, [filteredLeads]);

  const convertedLeadsCount = useMemo(() => {
    return filteredLeads.filter(lead => lead.conversao === "Lead Convertida").length;
  }, [filteredLeads]);

  const convertedLeadsPercentage = useMemo(() => {
    if (newContactsCount === 0) return 0;
    return (convertedLeadsCount / newContactsCount) * 100;
  }, [convertedLeadsCount, newContactsCount]);

  const leadsInContactCount = useMemo(() => {
    return filteredLeads.filter(lead => lead.estadodalead === "Em Contacto").length;
  }, [filteredLeads]);

  const leadsInContactPercentage = useMemo(() => {
    if (newContactsCount === 0) return 0;
    return (leadsInContactCount / newContactsCount) * 100;
  }, [leadsInContactCount, newContactsCount]);


  // Calculate previous period data for comparison
  const previousPeriodFilteredContacts = useMemo(() => {
    if (!contactsData || selectedPeriod === "all") return [];
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
    return filterAndProcessItems(contactsData, (contactDate) => isWithinInterval(contactDate, { start: start, end: end }), false);
  }, [contactsData, selectedPeriod, isAdjustingComparisons]);

  const previousPeriodFilteredLeads = useMemo(() => {
    if (!leadsData || selectedPeriod === "all") return [];
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
    return filterAndProcessItems(leadsData, (leadDate) => isWithinInterval(leadDate, { start: start, end: end }), true);
  }, [leadsData, selectedPeriod, isAdjustingComparisons]);

  const previousPeriodTotalContactsCount = useMemo(() => {
    return previousPeriodFilteredContacts.length;
  }, [previousPeriodFilteredContacts]);

  const previousPeriodNewContactsCount = useMemo(() => {
    return previousPeriodFilteredLeads.length;
  }, [previousPeriodFilteredLeads]);

  const getPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today":
        return "Hoje";
      case "7days":
        return "Últimos 7 Dias";
      case "30days":
        return "Últimos 30 Dias";
      case "60days":
        return "Últimos 60 Dias";
      case "12months":
        return "Últimos 12 Meses";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
      case "year":
        return "Este Ano";
      case "all":
        return "Todos";
      default:
        return "";
    }
  };

  const getPreviousPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today":
        return "Ontem";
      case "7days":
        return "7 Dias Anteriores";
      case "30days":
        return "30 Dias Anteriores";
      case "60days":
        return "60 Dias Anteriores";
      case "12months":
        return "12 Meses Anteriores";
      case "week":
        return "Semana Anterior";
      case "month":
        return "Mês Anterior";
      case "year":
        return "Ano Anterior";
      case "all":
        return "N/A";
      default:
        return "";
    }
  };

  const getTrendIcon = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) {
      return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    } else if (currentValue < previousValue) {
      return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    }
    return null;
  };

  const getTrendTextColor = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) {
      return "text-green-500";
    } else if (currentValue < previousValue) {
      return "text-red-500";
    }
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Vivusfisio</h1>
        <Card>
          <CardHeader>
            <CardTitle>Carregando Dados...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[100px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Vivusfisio</h1>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os dados: {error?.message || "Erro desconhecido."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const periodOptions: { value: FilterPeriod; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "7days", label: "Últimos 7 Dias" },
    { value: "30days", label: "Últimos 30 Dias" },
    { value: "60days", label: "Últimos 60 Dias" },
    { value: "12months", label: "Últimos 12 Meses" },
    { value: "week", label: "Esta Semana" },
    { value: "month", label: "Este Mês" },
    { value: "year", label: "Este Ano" },
    { value: "all", label: "Todos" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Vivusfisio</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={selectedPeriod} onValueChange={(value: FilterPeriod) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecionar Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedPeriod === "week" || selectedPeriod === "month" || selectedPeriod === "year") && (
          <Toggle
            pressed={isAdjustingComparisons}
            onPressedChange={setIsAdjustingComparisons}
            aria-label="Toggle ajustar comparações"
            className={cn(
              isAdjustingComparisons && "!bg-green-500 !text-white hover:!bg-green-600"
            )}
          >
            Ajustar Comparações
          </Toggle>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Contactos
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <Users className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContactsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className={cn("text-foreground", getTrendTextColor(totalContactsCount, previousPeriodTotalContactsCount))}>
                  {getPreviousPeriodLabel(selectedPeriod)}:
                </span>
                <span className={cn("ml-1", getTrendTextColor(totalContactsCount, previousPeriodTotalContactsCount))}>
                  {previousPeriodTotalContactsCount}
                </span>
                {getTrendIcon(totalContactsCount, previousPeriodTotalContactsCount)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newContactsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className={cn("text-foreground", getTrendTextColor(newContactsCount, previousPeriodNewContactsCount))}>
                  {getPreviousPeriodLabel(selectedPeriod)}:
                </span>
                <span className={cn("ml-1", getTrendTextColor(newContactsCount, previousPeriodNewContactsCount))}>
                  {previousPeriodNewContactsCount}
                </span>
                {getTrendIcon(newContactsCount, previousPeriodNewContactsCount)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CombinedBarCharts
          currentContacts={filteredContacts}
          previousContacts={previousPeriodFilteredContacts}
          currentLeads={filteredLeads}
          previousLeads={previousPeriodFilteredLeads}
          selectedPeriod={selectedPeriod}
        />
      </div>

      <RegistrationTrendChart
        allContacts={contactsData || []}
        allLeads={leadsData || []}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
};

export default Dashboard;