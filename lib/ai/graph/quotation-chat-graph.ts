import { StateGraph, END } from "@langchain/langgraph";
import { QuotationChatState } from "./state";
import { extractSpecs } from "./nodes/extract-specs";
import { evaluateCompleteness } from "./nodes/evaluate-completeness";
import { generateReply } from "./nodes/generate-reply";
import { getCheckpointer } from "./checkpointer";

function buildGraph() {
  const graph = new StateGraph(QuotationChatState)
    .addNode("extractSpecs", extractSpecs)
    .addNode("evaluateCompleteness", evaluateCompleteness)
    .addNode("generateReply", generateReply)
    .addEdge("__start__", "extractSpecs")
    .addEdge("extractSpecs", "evaluateCompleteness")
    .addEdge("evaluateCompleteness", "generateReply")
    .addEdge("generateReply", END);

  return graph;
}

export function getCompiledGraph() {
  const graph = buildGraph();
  const checkpointer = getCheckpointer();
  return graph.compile({ checkpointer });
}
