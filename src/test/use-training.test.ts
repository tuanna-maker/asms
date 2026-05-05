import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";
import { useTrainingCourse, useTrainingCourses } from "@/hooks/use-training";

const mockedUseQuery = vi.mocked(useQuery);

describe("use-training hooks", () => {
  it("returns list data from training courses query", () => {
    mockedUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey?.[0] === "trainingCourses") {
        return {
          data: [
            {
              id: "tc-1",
              title: "Course 1",
              type: "internal",
              startDate: "2026-01-02T00:00:00.000Z",
              endDate: "2026-01-05T00:00:00.000Z",
              participants: 3,
              status: "planned",
              location: "HCM",
            },
          ],
        } as any;
      }
      return { data: undefined, isLoading: false, isError: false, error: null } as any;
    });

    const { result } = renderHook(() => useTrainingCourses());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      id: "tc-1",
      title: "Course 1",
      type: "internal",
      startDate: "2026-01-02T00:00:00.000Z",
      endDate: "2026-01-05T00:00:00.000Z",
      participants: 3,
      status: "planned",
      location: "HCM",
    });
  });

  it("prefers mapped detail over list fallback", () => {
    mockedUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey?.[0] === "trainingCourses") {
        return {
          data: [
            {
              id: "tc-2",
              title: "List title",
              type: "internal",
              startDate: "2026-01-01T00:00:00.000Z",
              endDate: "2026-01-02T00:00:00.000Z",
              participants: 1,
              status: "planned",
            },
          ],
        } as any;
      }
      if (queryKey?.[0] === "trainingCourse") {
        return {
          data: {
            id: "tc-2",
            title: "Detail title",
            type: "external",
            instructorId: "gv-a",
            customerId: "kh-a",
            startDate: "2026-02-01T00:00:00.000Z",
            endDate: "2026-02-03T00:00:00.000Z",
            participants: 7,
            status: "ongoing",
            trainees: [{ id: "tr-1", fullName: "Nguyen A", attendance: "present", score: "9.5" }],
            sessions: [{ id: "s-1", date: "2026-02-01T00:00:00.000Z", startTime: "08:00", endTime: "10:00", topic: "Topic", status: "planned" }],
          },
          isLoading: false,
          isError: false,
          error: null,
        } as any;
      }
      return { data: undefined, isLoading: false, isError: false, error: null } as any;
    });

    const { result } = renderHook(() => useTrainingCourse("tc-2"));
    expect(result.current.course?.title).toBe("Detail title");
    expect(result.current.course?.type).toBe("external");
    expect(result.current.course?.instructor).toBe("gv-a");
    expect(result.current.course?.trainees?.[0]).toMatchObject({ name: "Nguyen A", score: 9.5 });
    expect(result.current.course?.schedule?.[0]).toMatchObject({ date: "2026-02-01", topic: "Topic" });
    expect(result.current.isLoading).toBe(false);
  });
});
