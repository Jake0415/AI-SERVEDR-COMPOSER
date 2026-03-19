"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Shield,
  Sparkles,
  Search,
  FileText,
  Cpu,
  MessageSquare,
  Star,
} from "lucide-react";

interface AiPrompt {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  systemPrompt: string;
  outputSchema: string | null;
  modelName: string | null;
  temperature: string | null;
  maxTokens: number | null;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = [
  { value: "extraction", label: "추출", icon: Search, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "matching", label: "매칭", icon: Cpu, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { value: "analysis", label: "분석", icon: MessageSquare, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { value: "recommendation", label: "추천", icon: Star, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
];

function getCategoryInfo(category: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[0];
}

const EMPTY_FORM = {
  slug: "",
  name: "",
  description: "",
  category: "extraction",
  systemPrompt: "",
  outputSchema: "",
  modelName: "",
  temperature: "",
  maxTokens: "",
};

export default function PromptsSettingsPage() {
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AiPrompt | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts");
      const json = await res.json();
      if (json.success) setPrompts(json.data);
    } catch {
      toast.error("프롬프트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditOpen(true);
  }

  function openEdit(p: AiPrompt) {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      systemPrompt: p.systemPrompt,
      outputSchema: p.outputSchema ?? "",
      modelName: p.modelName ?? "",
      temperature: p.temperature ?? "",
      maxTokens: p.maxTokens?.toString() ?? "",
    });
    setEditOpen(true);
  }

  function openClone(p: AiPrompt) {
    setEditingId(null);
    setForm({
      slug: `${p.slug}-copy`,
      name: `${p.name} (복사)`,
      description: p.description ?? "",
      category: p.category,
      systemPrompt: p.systemPrompt,
      outputSchema: p.outputSchema ?? "",
      modelName: p.modelName ?? "",
      temperature: p.temperature ?? "",
      maxTokens: p.maxTokens?.toString() ?? "",
    });
    setEditOpen(true);
  }

  async function handleSave() {
    if (!form.slug || !form.name || !form.systemPrompt) {
      toast.error("슬러그, 이름, 프롬프트 내용은 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        slug: form.slug,
        name: form.name,
        description: form.description || null,
        category: form.category,
        systemPrompt: form.systemPrompt,
        outputSchema: form.outputSchema || null,
        modelName: form.modelName || null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        maxTokens: form.maxTokens ? parseInt(form.maxTokens) : null,
      };

      const url = editingId ? `/api/prompts/${editingId}` : "/api/prompts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "저장에 실패했습니다.");
        return;
      }

      toast.success(editingId ? "프롬프트가 수정되었습니다." : "프롬프트가 추가되었습니다.");
      setEditOpen(false);
      fetchPrompts();
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/prompts/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "삭제에 실패했습니다.");
        return;
      }
      toast.success("프롬프트가 삭제되었습니다.");
      fetchPrompts();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleToggleActive(p: AiPrompt) {
    try {
      await fetch(`/api/prompts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      fetchPrompts();
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI 프롬프트 관리</h1>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 프롬프트 관리</h1>
          <p className="text-muted-foreground">
            LLM에 전달되는 시스템 프롬프트를 관리합니다. 프롬프트를 수정하면 AI 분석 결과가 달라질 수 있습니다.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          프롬프트 추가
        </Button>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">등록된 프롬프트가 없습니다.</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>
              첫 번째 프롬프트 추가
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prompts.map((p) => {
            const cat = getCategoryInfo(p.category);
            return (
              <Card key={p.id} className={!p.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.color}`}>
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {p.name}
                          {p.isSystem && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3" /> 시스템
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">v{p.version}</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.slug}</code>
                          {p.description && <span className="ml-2">{p.description}</span>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openClone(p)} title="복제">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="수정">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!p.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          title="삭제"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                    {p.systemPrompt.substring(0, 300)}
                    {p.systemPrompt.length > 300 && "..."}
                  </pre>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    {p.modelName && <span>모델: {p.modelName}</span>}
                    {p.temperature && <span>온도: {p.temperature}</span>}
                    {p.maxTokens && <span>토큰: {p.maxTokens}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 편집 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {editingId ? "프롬프트 수정" : "프롬프트 추가"}
            </DialogTitle>
            <DialogDescription>
              LLM에 전달되는 시스템 프롬프트를 설정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">슬러그 (고유 식별자)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="rfp-analyzer"
                  disabled={editingId !== null && prompts.find(p => p.id === editingId)?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">프롬프트명</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="RFP 분석 프롬프트"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">용도 설명</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="RFP 문서에서 HW 요구사항 추출"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">시스템 프롬프트</Label>
              <Textarea
                id="systemPrompt"
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="당신은 한국 IT 인프라 견적 전문가입니다..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputSchema">출력 스키마 (참고용)</Label>
              <Textarea
                id="outputSchema"
                value={form.outputSchema}
                onChange={(e) => setForm({ ...form, outputSchema: e.target.value })}
                placeholder='{ "configs": [...] }'
                className="min-h-[80px] font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelName">모델 오버라이드</Label>
                <Input
                  id="modelName"
                  value={form.modelName}
                  onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                  placeholder="gpt-4o (기본값)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">온도 (0.0~2.0)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="0.1 (기본값)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">최대 토큰</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={form.maxTokens}
                  onChange={(e) => setForm({ ...form, maxTokens: e.target.value })}
                  placeholder="4096 (기본값)"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : editingId ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프롬프트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; 프롬프트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
