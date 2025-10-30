"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts, getLeads } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown, UserPlus, CheckCircle2, Percent, BarChart3 } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval,
  format, setDate, getDayOfYear, setDayOfYear, getDay, getDate,
  addDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker"; // Import DateRange

import { LeadsByStatusPieChart } from "@/components/charts/LeadsByStatusPieChart";
import { LeadsByServiceBarChart } from "@/components/charts/LeadsByServiceBarChart";
import { ConversionTrendLineChart } from "@/components/charts/ConversionTrendLineChart";

type FilterPeriod = "today" | "7days" | "30days" | "60days" | "12months" | "week" | "month" | "year" | "all" | "custom";

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
const getPreviousPeriodInterval = (currentPeriod: FilterPeriod, now: Date, isAdjustingComparisons: boolean, currentRange?: { from?: Date; to?: Date }) => {
  let start: Date;
  let end: Date;
  let previousPeriodStart: Date;

  if (currentPeriod === "custom" && currentRange?.from && currentRange?.to) {
    const diffTime = Math.abs(currentRange.to.getTime() - currentRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    start = subDays(currentRange.from, diffDays + 1);
    end = subDays(currentRange.to, diffDays + 1);
  } else {
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
  }
  return { start, end };
};

// Helper function to filter items (contacts/leads) by period
const getPeriodFilter = (itemDate: Date, period: FilterPeriod, range?: { from?: Date; to?: Date }) => {
  const now = new Date();
  if (period === "custom" && range?.from && range?.to) {
    return isWithinInterval(itemDate, { start: startOfDay(range.from), end: endOfDay(range.to) });
  }
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

const Conversions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("30days");
  const [isAdjustingComparisons, setIsAdjustingComparisons] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ // Use DateRange type
    from: subDays(new Date(), 29),
    to: new Date(),
  });

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
      return {
        ...item,
        origemcontacto: item.origemcontacto ? item.origemcontacto.toLowerCase() : "desconhecida",
        concelho: item.concelho || "desconhecido",
        status: item.status || "desconhecido",
        conversao: item.conversao || "Não Convertida",
        estadodalead: item.estadodalead || "Desconhecido",
        servico: item.servico || "Desconhecido",
      };
    });
  };

  const currentFilteredLeads = useMemo(() => {
    return filterAndProcessItems(leadsData, (leadDate) => getPeriodFilter(leadDate, selectedPeriod, dateRange), true);
  }, [leadsData, selectedPeriod, dateRange]);

  const previousPeriodRange = useMemo(() => getPreviousPeriodInterval(selectedPeriod, new Date(), isAdjustingComparisons, dateRange), [selectedPeriod, isAdjustingComparisons, dateRange]);

  const previousFilteredLeads = useMemo(() => {
    if (!leadsData || selectedPeriod === "all") return [];
    return filterAndProcessItems(leadsData, (leadDate) => isWithinInterval(leadDate, { start: previousPeriodRange.start, end: previousPeriodRange.end }), true);
  }, [leadsData, selectedPeriod, isAdjustingComparisons, previousPeriodRange]);

  const totalLeadsCount = useMemo(() => {
    return currentFilteredLeads.length;
  }, [currentFilteredLeads]);

  const convertedLeadsCount = useMemo(() => {
    return currentFilteredLeads.filter(lead => lead.conversao === "Lead Convertida").length;
  }, [currentFilteredLeads]);

  const conversionRate = useMemo(() => {
    if (totalLeadsCount === 0) return 0;
    return (convertedLeadsCount / totalLeadsCount) * 100;
  }, [convertedLeadsCount, totalLeadsCount]);

  const leadsInContactCount = useMemo(() => {
    return currentFilteredLeads.filter(lead => lead.estadodalead === "Em Contacto").length;
  }, [currentFilteredLeads]);

  const previousTotalLeadsCount = useMemo(() => {
    return previousFilteredLeads.length;
  }, [previousFilteredLeads]);

  const previousConvertedLeadsCount = useMemo(() => {
    return previousFilteredLeads.filter(lead => lead.conversao === "Lead Convertida").length;
  }, [previousFilteredLeads]);

  const previousConversionRate = useMemo(() => {
    if (previousTotalLeadsCount === 0) return 0;
    return (previousConvertedLeadsCount / previousTotalLeadsCount) * 100;
  }, [previousConvertedLeadsCount, previousTotalLeadsCount]);

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
      case "custom":
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
        }
        return "Período Personalizado";
      default:
        return "";
    }
  };

  // Helper function to get comparison text and color
  const getComparisonText = (currentValue: number, previousValue: number, isPercentage: boolean = false) => {
    if (previousValue === 0) {
      if (currentValue > 0) {
        return {
          text: "↑ Inf. vs. período anterior",
          colorClass: "text-green-500",
        };
      }
      return {
        text: "0 vs. período anterior",
        colorClass: "text-muted-foreground",
      };
    }

    const diff = currentValue - previousValue;
    const absDiff = Math.abs(diff);
    const arrow = diff > 0 ? "↑" : (diff < 0 ? "↓" : "");
    const colorClass = diff > 0 ? "text-green-500" : (diff < 0 ? "text-red-500" : "text-muted-foreground");

    let formattedDiffText;
    if (isPercentage) {
        formattedDiffText = `${absDiff.toFixed(1)}%`;
    } else {
        formattedDiffText = absDiff.toFixed(0);
    }

    const text = diff === 0 ? "0 vs. período anterior" : `${arrow} ${formattedDiffText} vs. período anterior`;

    return {
      text,
      colorClass,
    };
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
        newFrom = startOfWeek(now, { weekStartsOn: 0, locale: ptBR });
        break;
      case "month":
        newFrom = startOfMonth(now);
        break;
      case "year":
        newFrom = startOfYear(now);
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

  const handleDateSelect = (range: DateRange | undefined) => { // Use DateRange type
    if (range?.from && range?.to) {
      setDateRange(range);
      setSelectedPeriod("custom");
    } else if (range?.from) {
      setDateRange({ from: range.from, to: range.from });
      setSelectedPeriod("custom");
    }
    setIsCalendarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Conversões</h1>
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
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Conversões</h1>
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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Conversões</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedPeriod} onValueChange={(value: FilterPeriod) => handlePeriodChange(value)}>
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

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger
              id="date"
              className={cn(
                "w-[200px] justify-start text-left font-normal inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-4 py-2", // Replicating Button's outline variant styles
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
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange.from ? dateRange : undefined}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeadsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                {(() => {
                  const { text, colorClass } = getComparisonText(totalLeadsCount, previousTotalLeadsCount);
                  return (
                    <>
                      <span className={cn("ml-1", colorClass)}>
                        {text}
                      </span>
                    </>
                  );
                })()}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                Total acumulado
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads Convertidas
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeadsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                {(() => {
                  const { text, colorClass } = getComparisonText(convertedLeadsCount, previousConvertedLeadsCount);
                  return (
                    <>
                      <span className={cn("ml-1", colorClass)}>
                        {text}
                      </span>
                    </>
                  );
                })()}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className className="text-xs text-muted-foreground">
                Total acumulado
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2 flex items-center justify-center">
              <Percent className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                {(() => {
                  const { text, colorClass } = getComparisonText(conversionRate, previousConversionRate, true);
                  return (
                    <>
                      <span className={cn("ml-1", colorClass)}>
                        {text}
                      </span>
                    </>
                  );
                })()}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                Total acumulado
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads em Contacto
            </CardTitle>
            <div className="rounded-full bg-yellow-500/10 p-2 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsInContactCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads atualmente em processo de contacto.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadsByStatusPieChart
          currentLeads={currentFilteredLeads}
          selectedPeriod={selectedPeriod}
          dateRange={dateRange}
        />
        <LeadsByServiceBarChart
          currentLeads={currentFilteredLeads}
          selectedPeriod={selectedPeriod}
          dateRange={dateRange}
        />
      </div>

      <ConversionTrendLineChart
        allLeads={leadsData || []}
        selectedPeriod={selectedPeriod}
        dateRange={dateRange}
      />
    </div>
  );
};

export default Conversions;