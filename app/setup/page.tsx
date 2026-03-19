"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setupAction } from "@/lib/auth/actions";
import { Server } from "lucide-react";

interface SetupFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  companyName: string;
  businessNumber: string;
  ceoName: string;
  address: string;
  businessType: string;
  businessItem: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { register, handleSubmit, formState: { errors }, trigger } = useForm<SetupFormData>();

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.initialized) {
          router.replace("/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleNext = async () => {
    const valid = await trigger(["email", "password", "name", "phone", "department"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: SetupFormData) => {
    setLoading(true);
    setError("");
    const result = await setupAction(data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">AI-SERVER-COMPOSER</CardTitle>
          <CardDescription>
            {step === 1 ? "슈퍼어드민 계정을 생성합니다" : "회사 정보를 입력합니다"}
          </CardDescription>
          <div className="flex justify-center gap-2 pt-2">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" type="email" placeholder="admin@company.co.kr" {...register("email", { required: "이메일을 입력하세요" })} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input id="password" type="password" placeholder="8자 이상" {...register("password", { required: "비밀번호를 입력하세요", minLength: { value: 8, message: "8자 이상 입력하세요" } })} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" placeholder="홍길동" {...register("name", { required: "이름을 입력하세요" })} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호</Label>
                    <Input id="phone" placeholder="010-1234-5678" {...register("phone", { required: "전화번호를 입력하세요" })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">부서명</Label>
                    <Input id="department" placeholder="영업부" {...register("department", { required: "부서명을 입력하세요" })} />
                  </div>
                </div>
                <Button type="button" className="w-full" onClick={handleNext}>다음</Button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">회사명</Label>
                  <Input id="companyName" placeholder="테스트 IT솔루션" {...register("companyName", { required: "회사명을 입력하세요" })} />
                  {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호</Label>
                  <Input id="businessNumber" placeholder="123-45-67890" {...register("businessNumber", { required: "사업자등록번호를 입력하세요" })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceoName">대표자명</Label>
                  <Input id="ceoName" placeholder="홍길동" {...register("ceoName", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">주소</Label>
                  <Input id="address" placeholder="서울시 강남구 테헤란로 123" {...register("address", { required: true })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">업태</Label>
                    <Input id="businessType" placeholder="정보통신업" {...register("businessType", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessItem">종목</Label>
                    <Input id="businessItem" placeholder="서버/네트워크" {...register("businessItem", { required: true })} />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>이전</Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "생성 중..." : "초기 설정 완료"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
