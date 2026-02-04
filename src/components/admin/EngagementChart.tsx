import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { getTemperature } from "./TemperatureBadge";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  created_at: string;
  last_interaction_at: string | null;
}

interface EngagementChartProps {
  clients: Client[];
}

const COLORS = {
  hot: "hsl(142, 70%, 45%)",
  warm: "hsl(40, 95%, 55%)",
  urgent: "hsl(25, 95%, 55%)",
  needsAttention: "hsl(0, 75%, 55%)",
};

export const EngagementChart = ({ clients }: EngagementChartProps) => {
  // Temperature distribution for pie chart
  const temperatureData = useMemo(() => {
    const hot = clients.filter((c) => getTemperature(c.last_interaction_at) === "hot").length;
    const warm = clients.filter((c) => getTemperature(c.last_interaction_at) === "warm").length;
    const urgent = clients.filter((c) => getTemperature(c.last_interaction_at) === "urgent").length;
    const superUrgent = clients.filter((c) => getTemperature(c.last_interaction_at) === "super_urgent").length;
    const needsAttention = urgent + superUrgent;

    return [
      { name: "Quentes", value: hot, color: COLORS.hot },
      { name: "Mornos", value: warm, color: COLORS.warm },
      { name: "Atenção", value: needsAttention, color: COLORS.needsAttention },
    ].filter((d) => d.value > 0);
  }, [clients]);

  // Timeline data for area chart (last 14 days of new clients)
  const timelineData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, 13);

    const days = eachDayOfInterval({ start: startDate, end: today });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const newClients = clients.filter((c) => {
        const created = new Date(c.created_at);
        return created >= dayStart && created < dayEnd;
      }).length;

      const activeClients = clients.filter((c) => {
        if (!c.last_interaction_at) return false;
        const interaction = new Date(c.last_interaction_at);
        return interaction >= dayStart && interaction < dayEnd;
      }).length;

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        novos: newClients,
        interações: activeClients,
      };
    });
  }, [clients]);

  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area Chart - Timeline */}
      <Card className="border-0 shadow-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividade dos Últimos 14 Dias</CardTitle>
          <CardDescription>Novos clientes e interações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(235, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(235, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInteracoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="novos"
                  name="Novos Clientes"
                  stroke="hsl(235, 70%, 50%)"
                  fillOpacity={1}
                  fill="url(#colorNovos)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="interações"
                  name="Interações"
                  stroke="hsl(142, 70%, 45%)"
                  fillOpacity={1}
                  fill="url(#colorInteracoes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Temperature Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição de Temperatura</CardTitle>
          <CardDescription>Saúde da base de clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value} cliente(s)`, ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
