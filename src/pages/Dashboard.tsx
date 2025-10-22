"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart";
import RegistrationTrendChart from "@/components/charts/RegistrationTrendChart";
import ContactCountyBarChart from "@/components/charts/ContactCountyBarChart";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle"; // Importar o componente Toggle

type FilterPeriod = "today" | "week" | "month" | "year" | "all";

// Helper function to get previous period interval
const getPreviousPeriodInterval = (currentPeriod: FilterPeriod, now: Date) => {
  let start: Date;
  let end: Date;

  switch (currentPeriod) {
    case "today":
      start = startOfDay(subDays(now, 1));
      end = endOfDay(subDays(now, 1));
      break;
    case "week":
      start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
      end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
      break;
    case "month":
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case "year":
      start = startOfYear(subYears(now, 1));
      end = endOfYear(subYears(now, 1));
      break;
    case "all":
      return { start: new Date(0), end: now };
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
  const [isAdjustingComparisons, setIsAdjustingComparisons] = useState(false); // Novo estado para Ajustar Comparações

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
        console.warn(`Invalid date string for item ${contact.id}: ${itemDateString}`);
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
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return processContactsForPeriod(contacts, (contactDate) => isWithinInterval(contactDate, { start: start, end: end }));
  }, [contacts, selectedPeriod]);

  const filteredContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado === "nao").length;
  }, [filteredContacts]);

  const previousPeriodContactsCount = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') return false;
      const contactDate = parseISO(contact.dataregisto);
      return !isNaN(contactDate.getTime()) && isWithinInterval(contactDate, { start: start, end: end });
    }).length;
  }, [contacts, selectedPeriod]);

  const getPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today":
        return "Hoje";
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
      <div className="flex gap-2 mb-4 items-center">
        <Button
          variant={selectedPeriod === "today" ? "default" : "outline"}
          onClick={() => { setSelectedPeriod("today"); }}
        >
          Hoje
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
            className={cn("ml-4", isAdjustingComparisons && "bg-green-500 text-white hover:bg-green-600")}
          >
            Ajustar Comparações
          </Toggle>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Cartão de Contactos */}
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
            <div className="text-2xl font-bold">{filteredContactsCount}</div>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
                <span className={cn("ml-1", getTrendTextColor(filteredContactsCount, previousPeriodContactsCount))}>
                  {previousPeriodContactsCount}
                </span>
                {getTrendIcon(filteredContactsCount, previousPeriodContactsCount)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Novo Cartão de Contactos Ativos */}
        <Card className="min-w-[280px] flex-shrink-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contactos Ativos
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-2 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Contactos não arquivados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Origin Bar Chart */}
      <ContactOriginBarChart
        currentContacts={filteredContacts}
        previousContacts={previousPeriodContacts}
        selectedPeriod={selectedPeriod}
      />

      {/* New Registration Trend Chart */}
      <RegistrationTrendChart
        contacts={contacts || []}
        selectedPeriod={selectedPeriod}
        isAdjustingComparisons={isAdjustingComparisons} // Passar o novo estado como prop
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