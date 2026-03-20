import type { QuotationChatStateType } from "../state";

const REQUIRED_FIELDS = ["cpu", "memory", "storage"] as const;

export async function evaluateCompleteness(
  state: QuotationChatStateType,
): Promise<Partial<QuotationChatStateType>> {
  if (state.currentSpecs.length === 0) {
    return {
      isComplete: false,
      suggestedQuestions: state.suggestedQuestions.length > 0
        ? state.suggestedQuestions
        : ["어떤 용도의 서버가 필요하신가요?", "서버 수량은 몇 대인가요?"],
    };
  }

  const missingFields: string[] = [];

  for (const spec of state.currentSpecs) {
    const reqs = spec.requirements;
    for (const field of REQUIRED_FIELDS) {
      if (!reqs[field]) {
        missingFields.push(`${spec.config_name ?? "서버"}: ${field}`);
      }
    }
  }

  if (missingFields.length > 0) {
    const questions = missingFields.slice(0, 3).map((f) => {
      const [server, field] = f.split(": ");
      const fieldNames: Record<string, string> = {
        cpu: "CPU 사양",
        memory: "메모리 용량",
        storage: "스토리지 구성",
      };
      return `${server}의 ${fieldNames[field] ?? field}을 알려주세요.`;
    });

    return {
      isComplete: false,
      suggestedQuestions: questions,
    };
  }

  return {
    isComplete: true,
    suggestedQuestions: [],
  };
}
