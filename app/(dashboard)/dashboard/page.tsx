import Link from "next/link";
import { redirect } from "next/navigation";
import { FileUp, Package, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, quotations, bidResults, customers } from "@/lib/db";
import { eq, sql, desc, and } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tenantId = user.tenantId;

  // 통계 조회 (병렬)
  const [partsCount, quotationsCount, wonCount, customersCount, recentQuotations] =
    await Promise.all([
      // 총 부품 수
      db
        .select({ count: sql<number>`count(*)` })
        .from(parts)
        .where(and(eq(parts.tenantId, tenantId), eq(parts.isDeleted, false)))
        .then((r) => Number(r[0]?.count ?? 0)),

      // 총 견적 수
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

      // 총 거래처 수
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.tenantId, tenantId))
        .then((r) => Number(r[0]?.count ?? 0)),

      // 최근 견적 5건
      db
        .select()
        .from(quotations)
        .where(eq(quotations.tenantId, tenantId))
        .orderBy(desc(quotations.createdAt))
        .limit(5),
    ]);

  // 낙찰률 계산
  const winRate =
    quotationsCount > 0
      ? ((wonCount / quotationsCount) * 100).toFixed(1)
      : "--";

  // 견적 상태 Badge
  function statusBadge(status: string) {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">초안</Badge>;
      case "published":
        return <Badge>발행됨</Badge>;
      case "won":
        return <Badge className="bg-green-600 text-white hover:bg-green-700">낙찰</Badge>;
      case "lost":
        return <Badge variant="destructive">실주</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // 견적 유형 한국어
  function typeLabel(type: string) {
    switch (type) {
      case "profitability":
        return "수익성";
      case "spec_match":
        return "규격충족";
      case "performance":
        return "성능향상";
      default:
        return type;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">대시보드</h2>
        <p className="text-muted-foreground">
          {user.name}님, 환영합니다. 오늘의 현황을 확인하세요.
        </p>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              등록 부품
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{partsCount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 견적
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quotationsCount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              낙찰률
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{winRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 거래처
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customersCount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 견적 5건 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 견적</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQuotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              아직 생성된 견적이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>견적번호</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">총액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>날짜</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-sm">
                      {q.quotationNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {typeLabel(q.quotationType)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {q.totalAmount.toLocaleString()}원
                    </TableCell>
                    <TableCell>{statusBadge(q.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 빠른 액션 */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/rfp">
            <FileUp className="h-4 w-4 mr-2" />
            RFP 업로드
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/parts">
            <Package className="h-4 w-4 mr-2" />
            부품 관리
          </Link>
        </Button>
      </div>
    </div>
  );
}
