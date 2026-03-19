const BLOG_REVALIDATE_SECONDS = 300;

type BlogBlockType = "heading" | "text" | "image";

export type BlogBlock = {
  type: BlogBlockType;
  text?: string;
  imageUrl?: string;
  alt?: string;
  caption?: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  restaurantId?: string | null;
  publishedAt?: string | null;
  tags?: string[];
  blocks: BlogBlock[];
};

export type SuggestedBlog = Pick<
  BlogPost,
  "title" | "slug" | "excerpt" | "coverImage" | "restaurantId" | "publishedAt" | "tags"
>;

export type BlogListMeta = {
  page: number;
  pages: number;
  limit: number;
  total: number;
};

type BackendResponse<T> = { ok?: boolean; data?: T } | T | null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getBackendBase = () => process.env.BACKEND_URL?.trim().replace(/\/$/, "") ?? null;

const unwrap = <T>(payload: BackendResponse<T>): T | null => {
  if (!payload) return null;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return ((payload as { data?: T }).data ?? null) as T | null;
  }
  return payload as T;
};

type FetchJsonOptions = {
  unwrapData?: boolean;
};

const fetchJson = async <T>(
  path: string,
  { unwrapData = true }: FetchJsonOptions = {}
): Promise<T | null> => {
  const backendBase = getBackendBase();
  if (!backendBase) return null;
  const target = `${backendBase}${path}`;
  try {
    const res = await fetch(target, { next: { revalidate: BLOG_REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as unknown;
    if (!payload) return null;
    if (!unwrapData) {
      return payload as T;
    }
    return unwrap(payload as BackendResponse<T>);
  } catch (error) {
    console.error(`[blogs] Failed to fetch ${target}`, error);
    return null;
  }
};

const cleanString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const NORMALIZED_TYPES: BlogBlockType[] = ["heading", "text", "image"];

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
    .slice(0, 5);
};

const mapBlocks = (rawBlocks: unknown): BlogBlock[] => {
  if (!Array.isArray(rawBlocks)) return [];
  return rawBlocks
    .map((entry): BlogBlock | null => {
      if (!isRecord(entry)) return null;
      const rawType = typeof entry.type === "string" ? entry.type.trim().toLowerCase() : "";
      if (!NORMALIZED_TYPES.includes(rawType as BlogBlockType)) return null;
      const block: BlogBlock = { type: rawType as BlogBlockType };
      if (rawType === "image") {
        block.imageUrl = cleanString(entry.imageUrl) ?? cleanString(entry.url) ?? cleanString(entry.src);
        block.alt = cleanString(entry.alt);
        block.caption = cleanString(entry.caption);
      } else {
        block.text = cleanString(entry.text);
      }
      return block;
    })
    .filter((block): block is BlogBlock => Boolean(block && (block.text || block.imageUrl || block.type === "heading")));
};

const normalizeInteger = (value: unknown, fallback: number, min: number): number => {
  const parsed =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string"
      ? Number.parseInt(value, 10)
      : null;
  if (typeof parsed === "number" && Number.isFinite(parsed)) {
    return Math.max(min, Math.floor(parsed));
  }
  return fallback;
};

const parseListMeta = (rawMeta: unknown, fallback: BlogListMeta): BlogListMeta => {
  if (!isRecord(rawMeta)) return fallback;
  const page = normalizeInteger(rawMeta.page, fallback.page, 1);
  const limit = normalizeInteger(rawMeta.limit, fallback.limit, 1);
  const total = normalizeInteger(rawMeta.total, fallback.total, 0);
  const derivedPages = Math.max(1, Math.ceil(total / limit));
  const pages = normalizeInteger(rawMeta.pages, fallback.pages || derivedPages, 1);
  return {
    page,
    limit,
    total,
    pages: Math.max(1, pages),
  };
};

type BlogListOptions = {
  page?: number;
  limit?: number;
};

export async function fetchBlogList(
  options: BlogListOptions = {}
): Promise<{ items: SuggestedBlog[]; meta: BlogListMeta }> {
  const rawPage = Number.isFinite(options.page) ? Number(options.page) : options.page;
  const rawLimit = Number.isFinite(options.limit) ? Number(options.limit) : options.limit;
  const page = normalizeInteger(rawPage, 1, 1);
  const limit = normalizeInteger(rawLimit, 12, 1);
  const cappedLimit = Math.min(limit, 48);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(cappedLimit),
  });

  const payload = await fetchJson<Record<string, unknown>>(
    `/api/blogs?${params.toString()}`,
    { unwrapData: false }
  );

  const defaultMeta: BlogListMeta = {
    page,
    limit: cappedLimit,
    total: 0,
    pages: 1,
  };

  if (!payload || !isRecord(payload)) {
    return { items: [], meta: defaultMeta };
  }

  const rawData = payload.data;
  const items: SuggestedBlog[] = Array.isArray(rawData)
    ? (rawData
        .map((entry) => {
          if (!isRecord(entry)) return null;
          const title = cleanString(entry.title);
          const slug = cleanString(entry.slug);
          if (!title || !slug) return null;
          return {
            title,
            slug,
            excerpt: cleanString(entry.excerpt),
            coverImage: cleanString(entry.coverImage),
            restaurantId: cleanString(entry.restaurantId) ?? null,
            publishedAt: cleanString(entry.publishedAt) ?? null,
            tags: normalizeTags(entry.tags),
          } satisfies SuggestedBlog;
        })
        .filter(Boolean) as SuggestedBlog[])
    : [];

  const fallbackMeta: BlogListMeta = {
    page,
    limit: cappedLimit,
    total: items.length,
    pages: Math.max(1, Math.ceil(items.length / cappedLimit)),
  };

  const meta = parseListMeta(payload.meta, fallbackMeta);

  return { items, meta };
}

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  const safeSlug = slug?.trim().toLowerCase();
  if (!safeSlug) return null;
  const data = await fetchJson<Record<string, unknown>>(`/api/blogs/${encodeURIComponent(safeSlug)}`);
  if (!data || !isRecord(data)) return null;
  const id = cleanString(data._id) ?? cleanString(data.id);
  const title = cleanString(data.title);
  const normalizedSlug = cleanString(data.slug) ?? safeSlug;
  if (!id || !title || !normalizedSlug) return null;

  return {
    _id: id,
    title,
    slug: normalizedSlug,
    excerpt: cleanString(data.excerpt),
    coverImage: cleanString(data.coverImage),
    restaurantId: cleanString(data.restaurantId) ?? null,
    publishedAt: cleanString(data.publishedAt) ?? null,
    tags: normalizeTags(data.tags),
    blocks: mapBlocks(data.blocks),
  };
}

export async function fetchBlogSuggestions(slug: string, limit = 3): Promise<SuggestedBlog[]> {
  const safeSlug = slug?.trim().toLowerCase();
  if (!safeSlug) return [];
  const params = new URLSearchParams();
  if (limit && Number.isFinite(limit)) {
    params.set("limit", String(Math.min(Math.max(Math.floor(limit), 1), 6)));
  }
  const query = params.size ? `?${params.toString()}` : "";
  const data = await fetchJson<unknown>(`/api/blogs/${encodeURIComponent(safeSlug)}/suggestions${query}`);
  if (!Array.isArray(data)) return [];
  const mapped = data
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const title = cleanString(entry.title);
      const suggestionSlug = cleanString(entry.slug);
      if (!title || !suggestionSlug) return null;
      return {
        title,
        slug: suggestionSlug,
        excerpt: cleanString(entry.excerpt),
        coverImage: cleanString(entry.coverImage),
        restaurantId: cleanString(entry.restaurantId) ?? null,
        publishedAt: cleanString(entry.publishedAt) ?? null,
        tags: normalizeTags(entry.tags),
      };
    })
    .filter(Boolean) as SuggestedBlog[];

  return mapped;
}

const WORDS_PER_MINUTE = 220;

const countWords = (text: string | undefined) =>
  text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

export function estimateReadingMinutes(blocks: BlogBlock[]): number {
  const words = blocks.reduce((total, block) => {
    if (block.type === "image") return total;
    return total + countWords(block.text);
  }, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE) || 1);
}
