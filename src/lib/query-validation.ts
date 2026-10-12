export const VALID_BRANCH_IDS = ["nganh-dong"] as const;

export const VALID_LEVEL_IDS = [
  "mo-mat",
  "canh-mem",
  "chan-cung",
  "tung-bay",
] as const;

export const VALID_CATEGORY_IDS = [
  "phat-phap",
  "hoat-dong-thanh-nien",
  "van-nghe",
] as const;

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  let page = parseInt(searchParams.get("page") || "1", 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(searchParams.get("limit") || "20", 10);
  if (isNaN(limit) || limit < 1) {
    limit = 20;
  }
  if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function parseSearchQuery(searchParams: URLSearchParams): {
  q: string | null;
  error?: string;
} {
  const rawQ = searchParams.get("q");
  if (rawQ === null) {
    return { q: null };
  }

  const trimmed = rawQ.trim();
  if (trimmed.length === 0) {
    return { q: "", error: "Từ khóa tìm kiếm không được để trống." };
  }

  if (trimmed.length > 200) {
    return { q: trimmed.slice(0, 200) };
  }

  return { q: trimmed };
}

export function validateFilterIds(searchParams: URLSearchParams): {
  branch?: string;
  level?: string;
  category?: string;
  error?: string;
} {
  const branch = searchParams.get("branch")?.trim();
  const level = searchParams.get("level")?.trim();
  const category = searchParams.get("category")?.trim();

  if (branch && !VALID_BRANCH_IDS.includes(branch as any)) {
    return { error: `Mã ngành không hợp lệ: '${branch}'.` };
  }

  if (level && !VALID_LEVEL_IDS.includes(level as any)) {
    return { error: `Mã bậc học không hợp lệ: '${level}'.` };
  }

  if (category) {
    if (category === "hoat-dong") {
      return {
        error:
          "Mã danh mục 'hoat-dong' không hợp lệ theo Master Data V1.2. Vui lòng dùng 'hoat-dong-thanh-nien'.",
      };
    }
    if (!VALID_CATEGORY_IDS.includes(category as any)) {
      return { error: `Mã lĩnh vực không hợp lệ: '${category}'.` };
    }
  }

  return { branch, level, category };
}
