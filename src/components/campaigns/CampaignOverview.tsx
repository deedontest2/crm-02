import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, MessageSquare, TrendingUp,
  Target, FileText, BarChart3, ArrowRight, Mail, Phone, Linkedin
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface StrategyComplete {
  message: boolean;
  audience: boolean;
  region: boolean;
  timing: boolean;
}

interface Props {
  campaign: any;
  accounts: any[];
  contacts: any[];
  communications: any[];
  isStrategyComplete: StrategyComplete;
  strategyProgress: number;
  onTabChange: (tab: string) => void;
}

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Active: "bg-primary/10 text-primary",
  Paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const stageOrder = ["Not Contacted", "Contacted", "Responded", "Qualified", "Converted"];

const stageBarColors: Record<string, string> = {
  "Not Contacted": "bg-slate-400",
  "Contacted": "bg-blue-500",
  "Responded": "bg-amber-500",
  "Qualified": "bg-purple-500",
  "Converted": "bg-emerald-500",
};

const commTypeStyles: Record<string, { badge: string; icon: any }> = {
  Email: { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", icon: Mail },
  Call: { badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", icon: Phone },
  Phone: { badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", icon: Phone },
  LinkedIn: { badge: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800", icon: Linkedin },
};

function parseRegionToCountries(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const r = JSON.parse(raw);
    if (Array.isArray(r)) {
      return Array.from(new Set(r.map((item: any) =>
        typeof item === "object" && item !== null ? item.country || item.region : String(item)
      ).filter(Boolean)));
    }
    if (typeof r === "object" && r !== null) {
      const out: string[] = [];
      Object.values(r).forEach((v) => {
        if (Array.isArray(v)) out.push(...(v as string[]));
        else if (v) out.push(String(v));
      });
      return Array.from(new Set(out));
    }
  } catch {}
  return [raw];
}

interface KPIConfig {
  label: string;
  value: number | string;
  icon: any;
  sub?: string;
  onClick?: () => void;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}

export function CampaignOverview({
  campaign, accounts, contacts, communications,
  isStrategyComplete, strategyProgress, onTabChange
}: Props) {
  const { data: deals = [] } = useQuery({
    queryKey: ["campaign-deals-overview", campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, stage, total_contract_value")
        .eq("campaign_id", campaign.id);
      if (error) throw error;
      return data;
    },
  });

  const emailCount = communications.filter((c: any) => c.communication_type === "Email").length;
  const callCount = communications.filter((c: any) => c.communication_type === "Call" || c.communication_type === "Phone").length;
  const linkedinCount = communications.filter((c: any) => c.communication_type === "LinkedIn").length;
  const outreachTotal = emailCount + callCount + linkedinCount;
  const responseCount = contacts.filter((c: any) =>
    c.stage === "Responded" || c.stage === "Qualified" || c.stage === "Converted"
  ).length;

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    stageOrder.forEach(s => counts[s] = 0);
    contacts.forEach((c: any) => {
      const stage = c.stage || "Not Contacted";
      if (counts[stage] !== undefined) counts[stage]++;
      else counts["Not Contacted"]++;
    });
    return stageOrder.map(s => ({ stage: s, count: counts[s] }));
  }, [contacts]);

  const maxStage = Math.max(1, ...stageData.map(s => s.count));

  const timelineData = useMemo(() => {
    if (communications.length === 0) return [];
    const weekMap: Record<string, number> = {};
    communications.forEach((c: any) => {
      if (!c.communication_date) return;
      const d = new Date(c.communication_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = format(weekStart, "dd MMM");
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    return Object.entries(weekMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([week, count]) => ({ week, count }));
  }, [communications]);

  const totalDealValue = deals.reduce((sum: number, d: any) => sum + (d.total_contract_value || 0), 0);
  const countries = useMemo(() => parseRegionToCountries(campaign.region), [campaign.region]);
  const description = (campaign.description || "").trim();
  const goal = (campaign.goal || "").trim();
  const notes = (campaign.notes || "").replace(/\[timezone:.+?\]\s*/g, "").trim();

  const kpis: KPIConfig[] = [
    {
      label: "Accounts", value: accounts.length, icon: Building2,
      onClick: () => onTabChange("setup"),
      borderColor: "border-l-blue-500", iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400", valueColor: "text-foreground",
    },
    {
      label: "Contacts", value: contacts.length, icon: Users,
      onClick: () => onTabChange("setup"),
      borderColor: "border-l-emerald-500", iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400", valueColor: "text-foreground",
    },
    {
      label: "Outreach", value: outreachTotal, icon: MessageSquare,
      sub: `${emailCount} ✉ · ${callCount} ☎ · ${linkedinCount} in`,
      onClick: () => onTabChange("monitoring"),
      borderColor: "border-l-purple-500", iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400", valueColor: "text-foreground",
    },
    {
      label: "Responses", value: responseCount, icon: TrendingUp,
      sub: contacts.length > 0 ? `${Math.round((responseCount / contacts.length) * 100)}% rate` : undefined,
      borderColor: "border-l-amber-500", iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400", valueColor: "text-foreground",
    },
    {
      label: "Deals", value: deals.length, icon: BarChart3,
      sub: totalDealValue > 0 ? `€${totalDealValue.toLocaleString()}` : undefined,
      onClick: () => onTabChange("monitoring"),
      borderColor: "border-l-indigo-500", iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400", valueColor: "text-foreground",
    },
    {
      label: "Setup", value: `${strategyProgress}/4`, icon: Target,
      sub: `${Math.round((strategyProgress / 4) * 100)}% done`,
      onClick: () => onTabChange("setup"),
      borderColor: "border-l-rose-500", iconBg: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400", valueColor: "text-foreground",
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              className={`border-l-4 ${k.borderColor} ${k.onClick ? "cursor-pointer hover:shadow-md transition-all" : ""}`}
              onClick={k.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{k.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${k.valueColor}`}>{k.value}</p>
                    {k.sub && <p className="text-xs text-muted-foreground mt-1 truncate">{k.sub}</p>}
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${k.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${k.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funnel + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Contact Funnel */}
        <Card className="lg:col-span-7 border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base font-semibold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onTabChange("setup")}
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Contact Funnel
              <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No contacts added yet</p>
            ) : (
              <div className="space-y-3">
                {stageData.map((s) => (
                  <div key={s.stage} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-foreground/80 truncate">{s.stage}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${stageBarColors[s.stage]} rounded-full transition-all`}
                        style={{ width: `${(s.count / maxStage) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-5 border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base font-semibold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onTabChange("monitoring")}
            >
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              Recent Activity
              <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {communications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No activity yet</p>
            ) : (
              <div className="divide-y divide-border">
                {communications.slice(0, 5).map((c: any) => {
                  const snippet = (c.subject || c.notes || "").toString().trim();
                  const style = commTypeStyles[c.communication_type] || commTypeStyles.Email;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 text-sm py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                      onClick={() => onTabChange("monitoring")}
                    >
                      <Badge variant="outline" className={`text-xs h-6 px-2 shrink-0 ${style.badge}`}>
                        {c.communication_type}
                      </Badge>
                      <span className="shrink-0 truncate max-w-[120px] text-sm font-medium">
                        {c.contacts?.contact_name || "Unknown"}
                      </span>
                      {snippet && <span className="text-sm text-muted-foreground truncate flex-1">· {snippet}</span>}
                      <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                        {c.communication_date ? format(new Date(c.communication_date), "dd MMM") : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outreach Timeline — always shown */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            Outreach Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {timelineData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              No outreach activity yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timelineData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip formatter={(v: number) => [v, "Messages"]} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <Card className="border-l-4 border-l-slate-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: meta */}
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Type</p>
                <p className="text-sm font-medium">{campaign.campaign_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Status</p>
                <Badge className={`${statusColors[campaign.status || "Draft"]} h-6 px-2.5 text-xs`} variant="secondary">
                  {campaign.status || "Draft"}
                </Badge>
              </div>
              {countries.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Region</p>
                  <div className="flex flex-wrap gap-1.5">
                    {countries.slice(0, 12).map((c) => (
                      <Badge key={c} variant="outline" className="h-6 px-2.5 text-xs bg-muted/40">{c}</Badge>
                    ))}
                    {countries.length > 12 && (
                      <Badge variant="outline" className="h-6 px-2.5 text-xs bg-muted/40">+{countries.length - 12}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: long text */}
            <div className="space-y-4">
              {description && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Description</p>
                  <div className="bg-muted/30 rounded-md p-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {description}
                  </div>
                </div>
              )}
              {goal && goal !== description && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Goal</p>
                  <div className="bg-muted/30 rounded-md p-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {goal}
                  </div>
                </div>
              )}
              {notes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Notes</p>
                  <div className="bg-muted/30 rounded-md p-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {notes}
                  </div>
                </div>
              )}
              {!description && !goal && !notes && (
                <p className="text-sm text-muted-foreground italic">No description, goal, or notes added yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
