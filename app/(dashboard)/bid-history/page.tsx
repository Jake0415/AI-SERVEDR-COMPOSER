import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, bidResults } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import { MonthlyChart } from "./monthly-chart";

export default async function BidHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tenantId = user.tenantId;

  // 통계 조회 (병렬)
  const [totalQuotations, wonCount, avgMargin] = await Promise.all([
    // 총 견적 건수
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.tenantId, tenantId))
      .then((r) => Number(r[0]?.count ?? 0)),

    // 낙찰 건수
    db
      .select({ count: sql<number>`count(*)` })
      .from(bidResults)
      .innerJoin(quotations, eq(bidResults.quotationId, quotations.id))
      .where(and(eq(quotations.tenantId, tenantId), eq(bidResults.result, "won")))
      .then((r) => Number(r[0]?.count ?? 0)),

    // 평균 마진율 (총공급가 대비 마진)
    db
      .select({
        avgRate: sql<number>`
          CASE WHEN sum(${quotations.totalSupply}) > 0
            THEN round(
              (sum(${quotations.totalSupply}) - sum(${quotations.totalCost}))::numeric
              / sum(${quotations.totalSupply})::numeric * 100, 1
            )
            ELSE 0
          END
        `,
      })
      .from(quotations)
      .where(eq(quotations.tenantId, tenantId))
      .then((r) => Number(r[0]?.avgRate ?? 0)),
  ]);

  // 낙찰률
  const winRate =
    totalQuotations > 0
      ? ((wonCount / totalQuotations) * 100).toFixed(1)
      : "--";

  // 월별 견적 추이 (최근 6개월 더미 + DB 데이터)
  // 실제 데이터를 기반으로 생성
  const monthlyData = await db
    .select({
      month: sql<string>`to_char(${quotations.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(quotations)
    .where(eq(quotations.tenantId, tenantId))
    .groupBy(sql`to_char(${quotations.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${quotations.createdAt}, 'YYYY-MM')`)
    .limit(12);

  const chartData = monthlyData.map((row) => ({
    month: row.month,
    count: Number(row.count),
  }));

  // 데이터가 없을 경우 최근 6개월 빈 데이터 표시
  const finalChartData =
    chartData.length > 0
      ? chartData
      : generateEmptyMonthlyData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">낙찰 이력</h2>
        <p className="text-muted-foreground">
          견적 현황과 낙찰률, 마진율을 확인합니다.
        </p>
      </div>

      {/* 통계 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 견적 건수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalQuotations.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              낙찰률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">
              {wonCount}건 낙찰 / {totalQuotations}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 마진율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgMargin}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 견적 추이 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 견적 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={finalChartData} />
        </CardContent>
      </Card>
    </div>
  );
}

/** 최근 6개월 빈 데이터 생성 */
function generateEmptyMonthlyData() {
  const data: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    data.push({ month, count: 0 });
  }
  return data;
}
