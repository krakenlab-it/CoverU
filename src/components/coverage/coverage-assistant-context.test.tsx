import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CoverageAssistantProvider,
  useCoverageAssistantPanel,
} from "@/components/coverage/coverage-assistant-context";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CoverageAssistantProvider>{children}</CoverageAssistantProvider>
  );
}

describe("CoverageAssistantProvider", () => {
  it("tracks open state and plan context", () => {
    const { result } = renderHook(() => useCoverageAssistantPanel(), {
      wrapper,
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.planContext).toBeNull();

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setPlanContext({
        planVersionId: "d1000000-0000-4000-8000-000000000001",
        planName: "[DEMO] Plan Básico Alpha",
      });
    });
    expect(result.current.planContext?.planName).toBe(
      "[DEMO] Plan Básico Alpha",
    );

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.close();
      result.current.setPlanContext(null);
    });
    expect(result.current.planContext).toBeNull();
  });
});
