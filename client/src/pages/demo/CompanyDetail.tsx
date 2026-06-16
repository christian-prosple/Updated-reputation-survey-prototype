import { useRoute, useLocation, useSearch } from "wouter";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import CompanyLogo from "@/components/CompanyLogo";
import MetricBarChart from "@/components/MetricBarChart";
import NotFound from "@/pages/not-found";
import {
  hasCompany,
  getCompanyRank,
  computeFunnel,
  CANONICAL_RANKING,
  AWARENESS_BARS,
  STRENGTH_BARS,
  AWARENESS_AVG,
  STRENGTH_AVG,
} from "@/data/company-metrics";

function SectionHeading({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl" data-testid={`heading-${title}`}>
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function CompanyDetail() {
  const [, params] = useRoute("/demo/employers/:company");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university
    ? `?university=${encodeURIComponent(university)}`
    : "";

  const name = params?.company ? decodeURIComponent(params.company) : "";

  if (!name || !hasCompany(name)) {
    return <NotFound />;
  }

  const rank = getCompanyRank(name);
  const total = CANONICAL_RANKING.length;
  const funnel = computeFunnel(rank, name);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <PageHeader
        university={university}
        backLabel="Back to employers"
        onBack={() => setLocation(`/demo/employers${uniParam}`)}
        title={
          <span className="flex items-center gap-3" data-testid="text-company-title">
            <CompanyLogo name={name} className="h-12 w-12" />
            {name}
          </span>
        }
        subtitle={
          <span data-testid="text-company-rank">
            #{rank} of {total} most sought after employers
          </span>
        }
      />

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-12 space-y-6">
        {/* Brand Awareness */}
        <Card>
          <CardContent className="pt-6">
            <SectionHeading
              title="Brand Awareness"
              hint="Share of students who recognise each employer's brand, ranked highest to lowest."
            />
            <MetricBarChart
              bars={AWARENESS_BARS}
              max={100}
              average={AWARENESS_AVG}
              highlightName={name}
              format={(v) => `${v}%`}
              testid="chart-awareness"
            />
          </CardContent>
        </Card>

        {/* Brand Strength */}
        <Card>
          <CardContent className="pt-6">
            <SectionHeading
              title="Brand Strength"
              hint="How strongly students rate each employer's brand on a 0–10 scale."
            />
            <MetricBarChart
              bars={STRENGTH_BARS}
              max={10}
              average={STRENGTH_AVG}
              highlightName={name}
              format={(v) => v.toFixed(1)}
              testid="chart-strength"
            />
          </CardContent>
        </Card>

        {/* Consideration Funnel */}
        <Card>
          <CardContent className="pt-6">
            <SectionHeading
              title="Consideration Funnel"
              hint={`How ${name} retains student interest from awareness through to first preference.`}
            />
            <div className="h-80 w-full" data-testid="chart-funnel">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={funnel}
                  margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, name]}
                    contentStyle={{
                      borderRadius: 0,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--foreground))" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Source: Employer League demo data — figures scale with ranking and
              are illustrative only.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
