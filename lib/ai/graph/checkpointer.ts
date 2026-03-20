import { MemorySaver } from "@langchain/langgraph";

// PostgresSaver는 Docker 환경에서만 사용 가능하므로
// 현재는 MemorySaver를 기본으로 사용하되,
// PostgresSaver로 전환 가능한 구조를 유지합니다.
// 프로덕션에서는 DATABASE_URL 기반 PostgresSaver를 사용합니다.

let checkpointerInstance: MemorySaver | null = null;

export function getCheckpointer(): MemorySaver {
  if (!checkpointerInstance) {
    checkpointerInstance = new MemorySaver();
  }
  return checkpointerInstance;
}
