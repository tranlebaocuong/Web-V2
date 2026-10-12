// Interface chuẩn theo REST API Contract V1.3

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    requestId: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface BranchSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface LevelSummary {
  id: string;
  branchId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  slug: string;
  sequence: number;
  levelId: string;
  categoryId: string;
  sourceId: string;
  summary?: string | null;
  publishStatus: "draft" | "published" | "hidden";
  contentStatus: "raw_extracted" | "editing" | "ready";
}
