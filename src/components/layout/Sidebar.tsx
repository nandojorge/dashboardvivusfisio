"use client";

import { Link } from "react-router-dom";
import { Users, Menu, CheckCircle2 } from "lucide-react"; // Added CheckCircle2 icon
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Users, label: "Contactos", path: "/" },
  { icon: CheckCircle2, label: "Conversões", path: "/conversions" }, // New item for Conversions
];

export const Sidebar = () => {
  const isMobile = useIsMobile();

  const renderNavLinks = (forMobileSheet: boolean) => (
    <nav className="grid gap-1 p-2">
      {navItems.map((item) => (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              asChild
              size={forMobileSheet ? "default" : "icon"}
              className={cn(
                forMobileSheet ? "w-full justify-start" : "",
              )}
            >
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-muted-foreground transition-all hover:text-primary",
                  forMobileSheet ? "px-3 py-2" : "p-0",
                  !forMobileSheet && "justify-center",
                )}
              >
                <item.icon className="h-4 w-4" />
                {forMobileSheet && <span>{item.label}</span>}
                {!forMobileSheet && <span className="sr-only">{item.label}</span>}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                {/* <Stethoscope className="h-6 w-6" /> */}
                <span className="text-lg font-bold text-primary">Vivusfisio</span> {/* Placeholder text logo */}
                <span className="sr-only">Vivusfisio</span>
              </Link>
            </div>
            <ScrollArea className="flex-1">
              {renderNavLinks(true)}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          to="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          {/* <Stethoscope className="h-4 w-4 transition-all group-hover:scale-110" /> */}
          <span className="text-sm font-bold text-primary-foreground">VF</span> {/* Abbreviation for small icon */}
          <span className="sr-only">Vivusfisio</span>
        </Link>
        <Separator />
        {renderNavLinks(false)}
      </nav>
    </aside>
  );
};