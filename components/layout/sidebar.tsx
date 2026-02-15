"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Settings,
  Rocket,
  Target,
  MousePointerClick,
  Image,
  DollarSign,
  BarChart3,
  Brain,
  Calendar,
  Wallet,
  Building2,
  PieChart,
  Users,
  AlertCircle,
  GitCompare,
  Sparkles,
} from "lucide-react";

interface Route {
  label: string;
  icon?: any;
  href?: string;
  children?: Route[];
}

const routes: Route[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Creative Analytics",
    icon: Sparkles,
    children: [
      { label: "Top Creatives", icon: Trophy, href: "/top-creatives" },
      { label: "New Launches", icon: Rocket, href: "/new-launches" },
      { label: "Top Hooks", icon: Target, href: "/top-hooks" },
      { label: "Top Clicks", icon: MousePointerClick, href: "/top-clicks" },
      { label: "Static Analysis", icon: Image, href: "/static-analysis" },
      { label: "Top Converters", icon: DollarSign, href: "/top-converters" },
      { label: "Fatigue Monitor", icon: AlertTriangle, href: "/fatigue" },
      { label: "Comparative", icon: BarChart3, href: "/comparative" },
      { label: "Trends", icon: TrendingUp, href: "/trends" },
      { label: "Weekly Leaderboard", icon: Calendar, href: "/weekly-leaderboard" },
      { label: "Concepts", icon: Brain, href: "/concepts" },
    ],
  },
  {
    label: "Media Buying",
    icon: Wallet,
    children: [
      { label: "Daily Pulse", icon: BarChart3, href: "/media-buying/daily-pulse" },
      { label: "Full Funnel WoW", icon: TrendingUp, href: "/media-buying/funnel" },
      { label: "Campaign Manager", icon: Building2, href: "/media-buying/campaigns" },
      { label: "Budget Pacing", icon: DollarSign, href: "/media-buying/budget" },
      { label: "Audience Insights", icon: Users, href: "/media-buying/audience" },
      { label: "Diagnostic Center", icon: AlertCircle, href: "/media-buying/diagnostic" },
    ],
  },
  {
    label: "Compare",
    icon: GitCompare,
    href: "/compare",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderRoute = (route: Route, level = 0) => {
    const isActive = route.href === pathname;
    const hasChildren = route.children && route.children.length > 0;

    if (hasChildren) {
      return (
        <div key={route.label} className="space-y-1">
          <div className={cn(
            "text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2",
            level === 0 && "mt-4 pt-4 border-t first:mt-0 first:pt-0 first:border-0"
          )}>
            {route.icon && <route.icon className="h-4 w-4 inline mr-2" />}
            {route.label}
          </div>
          <div className="space-y-1">
            {route.children!.map((child) => renderRoute(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={route.href}
        href={route.href || "#"}
        className={cn(
          "text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 rounded-lg transition",
          level > 0 && "pl-8",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground"
        )}
      >
        <div className="flex items-center flex-1">
          {route.icon && <route.icon className={cn("h-4 w-4 mr-2")} />}
          {route.label}
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-2 py-4 flex flex-col h-full bg-card border-r">
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center pl-3 mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Creative Analytics
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => renderRoute(route))}
        </div>
      </div>
    </div>
  );
}
