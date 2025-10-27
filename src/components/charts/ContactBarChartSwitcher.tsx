"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ContactOriginBarChart from "./ContactOriginBarChart";
import ContactCountyBarChart from "./ContactCountyBarChart";
import { Contact } from '@/types/contact'; // Importar a interface Contact

interface ContactBarChartSwitcherProps {
  currentContacts: Contact[];
  previousContacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all" | "7days" | "30days" | "60days" | "12months";
}

export const ContactBarChartSwitcher: React.FC<ContactBarChartSwitcherProps> = ({
  currentContacts,
  previousContacts,
  selectedPeriod,
}) => {
  const [activeChart, setActiveChart] = useState<'origin' | 'county'>('origin');

  const getChartTitle = () => {
    if (activeChart === 'origin') {
      return "Contactos por Origem";
    } else {
      return "Contactos por Concelho";
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{getChartTitle()}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={activeChart === 'origin' ? 'default' : 'outline'}
            onClick={() => setActiveChart('origin')}
            size="sm"
          >
            Origem
          </Button>
          <Button
            variant={activeChart === 'county' ? 'default' : 'outline'}
            onClick={() => setActiveChart('county')}
            size="sm"
          >
            Concelho
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0"> {/* Remove padding here, let the charts manage it */}
        {activeChart === 'origin' ? (
          <ContactOriginBarChart
            currentContacts={currentContacts}
            previousContacts={previousContacts}
            selectedPeriod={selectedPeriod}
          />
        ) : (
          <ContactCountyBarChart
            currentContacts={currentContacts}
            previousContacts={previousContacts}
            selectedPeriod={selectedPeriod}
          />
        )}
      </CardContent>
    </Card>
  );
};