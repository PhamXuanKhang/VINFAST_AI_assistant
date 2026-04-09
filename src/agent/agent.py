"""
VinFast Agent — LangGraph StateGraph Builder
=============================================
Builds the compiled LangGraph agent with phase-based routing,
tool execution, and conversation memory.
"""

import os
from typing import Literal

from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from src.agent.state import VinFastState
from src.agent.nodes import (
    router_node,
    greeting_node,
    car_discovery_node,
    finance_question_node,
    finance_full_pay_node,
    installment_node,
    handoff_node,
    guardrail_node,
    extract_state_updates,
)
from src.agent.prompts import SYSTEM_PROMPT
from src.tools.registry import TOOLS


def get_llm(model: str = None, temperature: float = 0.3):
    """Get ChatOpenAI instance with tools bound."""
    model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
    api_key = os.getenv("OPENAI_API_KEY")

    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        temperature=temperature,
    )
    return llm


def _route_by_phase(state: VinFastState) -> str:
    """Route to the appropriate phase node based on current_phase."""
    phase = state.get("current_phase", "GREETING")

    phase_map = {
        "GREETING": "greeting",
        "CAR_DISCOVERY": "car_discovery",
        "FINANCE_QUESTION": "finance_question",
        "FINANCE_FULL_PAY": "finance_full_pay",
        "FINANCE_INSTALLMENT": "installment",
        "HANDOFF_COLLECT": "handoff",
        "HANDOFF_DONE": "respond",
        "GUARDRAIL": "guardrail",
    }
    return phase_map.get(phase, "car_discovery")


def _should_use_tools(state: VinFastState) -> Literal["tools", "respond"]:
    """Check if the last AI message has tool calls."""
    messages = state.get("messages", [])
    if not messages:
        return "respond"

    last = messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "respond"


def build_vinfast_graph(checkpointer=None):
    """Build and compile the VinFast AI chatbot graph.

    Args:
        checkpointer: LangGraph checkpointer for conversation memory.
                     Defaults to MemorySaver() if not provided.

    Returns:
        Compiled LangGraph runnable.
    """
    llm = get_llm()
    llm_with_tools = llm.bind_tools(TOOLS)
    tool_node = ToolNode(TOOLS)

    if checkpointer is None:
        checkpointer = MemorySaver()

    # --- Define the graph ---
    graph = StateGraph(VinFastState)

    # --- Add nodes ---
    graph.add_node("router", router_node)
    graph.add_node("greeting", greeting_node)
    graph.add_node("car_discovery", car_discovery_node)
    graph.add_node("finance_question", finance_question_node)
    graph.add_node("finance_full_pay", finance_full_pay_node)
    graph.add_node("installment", installment_node)
    graph.add_node("handoff", handoff_node)
    graph.add_node("guardrail", guardrail_node)

    # LLM node — calls the model with tools
    def llm_node(state: VinFastState):
        messages = state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    graph.add_node("llm", llm_node)
    graph.add_node("tools", tool_node)
    graph.add_node("post_process", extract_state_updates)

    # --- Set entry point ---
    graph.set_entry_point("router")

    # --- Add edges ---

    # Router → Phase nodes (conditional)
    graph.add_conditional_edges(
        "router",
        _route_by_phase,
        {
            "greeting": "greeting",
            "car_discovery": "car_discovery",
            "finance_question": "finance_question",
            "finance_full_pay": "finance_full_pay",
            "installment": "installment",
            "handoff": "handoff",
            "guardrail": "guardrail",
            "respond": "post_process",
        },
    )

    # Phase nodes → LLM
    for phase_node in ["greeting", "car_discovery", "finance_question",
                       "finance_full_pay", "installment", "handoff", "guardrail"]:
        graph.add_edge(phase_node, "llm")

    # LLM → Tools or Post-process (conditional)
    graph.add_conditional_edges(
        "llm",
        _should_use_tools,
        {
            "tools": "tools",
            "respond": "post_process",
        },
    )

    # Tools → LLM (loop back for observation)
    graph.add_edge("tools", "llm")

    # Post-process → END
    graph.add_edge("post_process", END)

    # --- Compile ---
    return graph.compile(checkpointer=checkpointer)


# ---------------------------------------------------------------------------
# Convenience runner
# ---------------------------------------------------------------------------

_graph = None
_checkpointer = None


def get_agent():
    """Get or create the singleton agent instance."""
    global _graph, _checkpointer
    if _graph is None:
        _checkpointer = MemorySaver()
        _graph = build_vinfast_graph(checkpointer=_checkpointer)
    return _graph


def chat(user_message: str, thread_id: str = "default") -> str:
    """Send a message and get a response. Maintains conversation state.

    Args:
        user_message: The user's message text.
        thread_id: Conversation thread ID for memory.

    Returns:
        The AI assistant's response text.
    """
    agent = get_agent()
    config = {"configurable": {"thread_id": thread_id}}

    result = agent.invoke(
        {"messages": [("user", user_message)]},
        config=config,
    )

    # Extract the last AI message
    messages = result.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "content") and msg.content and not (hasattr(msg, "tool_calls") and msg.tool_calls):
            return msg.content

    return "Xin lỗi, em chưa thể trả lời câu hỏi này. Bạn muốn kết nối với tư vấn viên không?"
