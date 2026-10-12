import { NextResponse } from "next/server";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `req-${crypto.randomUUID()}`;
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function apiSuccess<T>(
  data: T,
  options?: {
    requestId?: string;
    status?: number;
    headers?: HeadersInit;
  }
) {
  const requestId = options?.requestId || generateRequestId();
  const status = options?.status || 200;

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...options?.headers,
      },
    }
  );
}

export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  options?: {
    requestId?: string;
    status?: number;
    headers?: HeadersInit;
  }
) {
  const requestId = options?.requestId || generateRequestId();
  const status = options?.status || 200;

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...options?.headers,
      },
    }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  options?: {
    requestId?: string;
    headers?: HeadersInit;
  }
) {
  const requestId = options?.requestId || generateRequestId();

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        requestId,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...options?.headers,
      },
    }
  );
}
