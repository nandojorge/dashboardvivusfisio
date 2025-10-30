"use client";

import { Contact } from "@/types/contact";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

export const columns = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "origemcontacto",
    header: "Origem",
    cell: ({ row }: { row: Contact }) => {
      return row.origemcontacto ? row.origemcontacto : "N/A";
    },
  },
  {
    accessorKey: "dataregisto",
    header: "Data de Registo",
    cell: ({ row }: { row: Contact }) => {
      return row.dataregisto ? format(new Date(row.dataregisto), "dd/MM/yyyy", { locale: ptBR }) : "N/A";
    },
  },
];