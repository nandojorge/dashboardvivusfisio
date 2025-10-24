"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
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
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart";
import RegistrationTrendChart from "@/components/charts/RegistrationTrendChart";
import ContactCountyBarChart from "@/components/charts/ContactCountyBarChart";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

type FilterPeriod = "today" | "7days" | "30days" | "60days" | "12months" | "week" | "month" | "year" | "all";

// Helper function to get the real-time cutoff date for a given period's start date
const getRealTimeCutoffDate = (periodStartDate: Date, selectedPeriod: "week" | "month" | "year", now: Date): Date => {
  let cutoffDate = periodStartDate;

  switch (selectedPeriod) {
    case "week":
      // Cutoff is the same day of the week as 'now' within the 'periodStartDate' week
      const currentDayOfWeek = getDay(now); // 0 (Sun) - 6 (Sat)
      cutoffDate = addDays(startOfWeek(periodStartDate, { weekStartsOn: 0, locale: ptBR }), currentDayOfWeek);
      return endOfDay(cutoffDate); // Include the entire cutoff day
    case "month":
      // Cutoff is the same day of the month as 'now' within the 'periodStartDate' month
      const currentDayOfMonth = getDate(now);
      cutoffDate = setDate(startOfMonth(periodStartDate), currentDayOfMonth);
      return endOfDay(cutoffDate);
    case "year":
      // Cutoff is the same day of the year as 'now' within the 'periodStartDate' year
      const currentDayOfYear = getDayOfYear(now);
      cutoffDate = setDayOfYear(startOfYear(periodStartDate), currentDayOfYear);
      return endOfDay(cutoffDate);
    default:
      return now; // Should not be reached for these periods
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
      start = startOfDay(subDays(now, 14)); // 7 days before the last 7 days
      end = endOfDay(subDays(now, 8)); // End of the day before the current 7-day period starts
      break;
    case "30days":
      start = startOfDay(subDays(now, 60)); // 30 days before the last 30 days
      end = endOfDay(subDays(now, 31)); // End of the day before the current 30-day period starts
      break;
    case "60days":
      start = startOfDay(subDays(now, 120)); // 60 days before the last 60 days
      end = endOfDay(subDays(now, 61)); // End of the day before the current 60-day period starts
      break;
    case "12months":
      start = startOfDay(subMonths(now, 24)); // 12 months before the last 12 months
      end = endOfDay(subMonths(now, 13)); // End of the day before the current 12-month period starts
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
      return { start: new Date(0), end: now }; // "All" period doesn't have a "previous" in this context
    default:
      return { start: now, end: now };
  }
  return { start, end };
};

// Helper function to filter items (contacts) by period
const getPeriodFilter = (itemDate: Date, period: FilterPeriod) => {
  const now = new Date();
  switch (period) {
    case "today":
      return isToday(itemDate);
    case "7days":
      const sevenDaysAgo = subDays(now, 6); // Includes today
      return isWithinInterval(itemDate, { start: startOfDay(sevenDaysAgo), end: endOfDay(now) });
    case "30days":
      const thirtyDaysAgo = subDays(now, 29); // Includes today
      return isWithinInterval(itemDate, { start: startOfDay(thirtyDaysAgo), end: endOfDay(now) });
    case "60days":
      const sixtyDaysAgo = subDays(now, 59); // Includes today
      return isWithinInterval(itemDate, { start: startOfDay(sixtyDaysAgo), end: endOfDay(now) });
    case "12months":
      const twelveMonthsAgo = subMonths(now, 11); // Includes current month
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

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  // Define origins in lowercase for consistency
  const origins = ["website", "referral", "social media", "email marketing", "direct"];
  // Define some example counties for demonstration if 'concelho' is missing
  const exampleCounties = ["Lisboa", "Porto", "Coimbra", "Faro", "Braga", "Aveiro"];

  const processContactsForPeriod = (allContacts: Contact[] | undefined, periodFilterFn: (contactDate: Date) => boolean) => {
    if (!allContacts) return [];
    return allContacts.filter((contact) => {
      let itemDateString: string | undefined;
      if ('dataregisto' in contact) {
        itemDateString = contact.dataregisto;
      }

      if (!itemDateString || typeof itemDateString !== 'string') {
        return false;
      }
      const itemDate = parseISO(itemDateString);
      if (isNaN(itemDate.getTime())) {
        console.warn(`Invalid date string for contact ${contact.id}: ${itemDateString}`);
        return false;
      }
      return periodFilterFn(itemDate);
    }).map((contact) => {
      let assignedOrigin = contact.origemcontacto ? contact.origemcontacto.toLowerCase() : '';
      if (!assignedOrigin) {
        assignedOrigin = origins[Math.floor(Math.random() * origins.length)];
      }

      let assignedCounty = contact.concelho ? contact.concelho : '';
      if (!assignedCounty) {
        assignedCounty = exampleCounties[Math.floor(Math.random() * exampleCounties.length)];
      }

      return {
        ...contact,
        origemcontacto: assignedOrigin,
        concelho: assignedCounty, // Atribuir concelho
      };
    });
  };

  const filteredContacts = useMemo(() => {
    return processContactsForPeriod(contacts, (contactDate) => getPeriodFilter(contactDate, selectedPeriod));
  }, [contacts, selectedPeriod]);

  // Calculate previous period contacts (actual objects)
  const previousPeriodContacts = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return [];
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
    return processContactsForPeriod(contacts, (contactDate) => isWithinInterval(contactDate, { start: start, end: end }));
  }, [contacts, selectedPeriod, isAdjustingComparisons]);

  const totalContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const newContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.status === "Lead").length;
  }, [filteredContacts]);

  const previousPeriodTotalContactsCount = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') return false;
      const contactDate = parseISO(contact.dataregisto);
      return !isNaN(contactDate.getTime()) && isWithinInterval(contactDate, { start: start, end: end });
    }).length;
  }, [contacts, selectedPeriod, isAdjustingComparisons]);

  const previousPeriodNewContactsCount = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now, isAdjustingComparisons);
    return contacts.filter((contact) => {
      if (contact.status !== "Lead") return false;
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') return false;
      const contactDate = parseISO(contact.dataregisto);
      return !isNaN(contactDate.getTime()) && isWithinInterval(contactDate, { start: start, end: end });
    }).length;
  }, [contacts, selectedPeriod, isAdjustingComparisons]);

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
        <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
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
        <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
      <div className="flex gap-2 mb-4 items-center flex-wrap"> {/* Added flex-wrap for responsiveness */}
        <Button
          variant={selectedPeriod === "today" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("today"); }}
        >
          Hoje
        </Button>
        <Button
          variant={selectedPeriod === "7days" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("7days"); }}
        >
          7 Dias
        </Button>
        <Button
          variant={selectedPeriod === "30days" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("30days"); }}
        >
          30 Dias
        </Button>
        <Button
          variant={selectedPeriod === "60days" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("60days"); }}
        >
          60 Dias
        </Button>
        <Button
          variant={selectedPeriod === "12months" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("12months"); }}
        >
          12 Meses
        </Button>
        <Button
          variant={selectedPeriod === "week" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("week"); }}
        >
          Semana
        </Button>
        <Button
          variant={selectedPeriod === "month" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("month"); }}
        >
          Mês
        </Button>
        <Button
          variant={selectedPeriod === "year" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("year"); }}
        >
          Ano
        </Button>
        <Button
          variant={selectedPeriod === "all" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("all"); }}
        >
          Todos
        </Button>

        {/* Botão "Ajustar Comparações" */}
        {(selectedPeriod === "week" || selectedPeriod === "month" || selectedPeriod === "year") && (
          <Toggle
            pressed={isAdjustingComparisons}
            onPressedChange={setIsAdjustingComparisons}
            aria-label="Toggle ajustar comparações"
            className={cn(
              "ml-4",
              isAdjustingComparisons && "!bg-green-500 !text-white hover:!bg-green-600"
            )}
          >
            Ajustar Comparações
          </Toggle>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Cartão de Total de Contactos */}
        <Card className="min-w-[280px] flex-shrink-0">
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
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
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

        {/* Cartão de Novos Contactos (Leads) */}
        <Card className="min-w-[280px] flex-shrink-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Novos Contactos (Leads)
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newContactsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
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

      {/* Contact Origin Bar Chart */}
      <ContactOriginBarChart
        currentContacts={filteredContacts}
        previousContacts={previousPeriodContacts}
        selectedPeriod={selectedPeriod}
      />

      {/* Registration Trend Chart */}
      <RegistrationTrendChart
        contacts={contacts || []}
        selectedPeriod={selectedPeriod}
        isAdjustingComparisons={isAdjustingComparisons}
      />

      {/* Contact County Bar Chart */}
      <ContactCountyBarChart
        currentContacts={filteredContacts}
        previousContacts={previousPeriodContacts}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
};

export default Dashboard;