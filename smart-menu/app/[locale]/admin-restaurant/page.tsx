"use client";

import clsx from "clsx";
import Image from "next/image";
import { PencilLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import assistantIllustration from "@/public/images/ai-assistant-cook.png";
import { type Locale } from "@/i18n";

type AdminUser = {
  id?: string;
  username: string;
  name?: string | null;
  email?: string | null;
  restaurantId?: string;
  isActive?: boolean;
};

type AiCredits = {
  remaining?: number | null;
  used?: number | null;
};

type Restaurant = {
  _id?: string;
  name?: string | null;
  slug?: string | null;
  currency?: string | null;
  timezone?: string | null;
  supportedLanguages?: string[] | null;
  aiEnabled?: boolean | null;
  plan?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
  aiAssistantName?: Partial<Record<string, string>> | null;
  aiCredits?: AiCredits | null;
};

type LocalizedValue = Partial<Record<Locale, string>> | string | null | undefined;

type AdminMenuItem = {
  _id: string;
  name?: LocalizedValue;
  description?: LocalizedValue;
  image?: {
    url?: string;
    altMk?: string;
    altSq?: string;
    altEn?: string;
  };
  price?: number | null;
  mealType?: string | null;
  kind?: string | null;
  shouldBeDisplayed?: boolean | null;
  categoryId?: {
    name?: LocalizedValue;
  } | null;
  subcategoryId?: {
    name?: LocalizedValue;
  } | null;
  tags?: string[] | null;
  updatedAt?: string | null;
};

type RestaurantFeedbackEntry = {
  _id: string;
  foodRating: number;
  serviceRating: number;
  suggestion?: string | null;
  submittedFrom?: string | null;
  createdAt?: string | null;
};

const MENU_ITEMS_PER_PAGE = 6;

type AdminLoginSuccess = {
  ok: true;
  token: string;
  admin: AdminUser;
  restaurant: Restaurant;
};

type AdminLoginError = {
  ok: false;
  error?: string;
  message?: string;
  data?: null;
};

type AdminLoginResponse = AdminLoginSuccess | AdminLoginError | null;

function isAdminLoginError(
  payload: AdminLoginResponse
): payload is AdminLoginError {
  return Boolean(payload && payload.ok === false);
}

type AdminSession = {
  token: string;
  admin: AdminUser;
  restaurant: Restaurant;
  loggedAt: string;
};

type LoginFormState = {
  username: string;
  password: string;
};

type LoginStatus = "idle" | "submitting" | "success" | "error";

const SESSION_KEY = "smart-menu::restaurant-admin-session";
const REMEMBER_KEY = "smart-menu::restaurant-admin-remember";

const LANGUAGE_LABELS: Record<string, string> = {
  mk: "Македонски",
  sq: "Shqip",
  en: "English",
  al: "Shqip",
  tr: "Türkçe",
  sr: "Српски",
};

export default function AdminDashboardPage() {
  const t = useTranslations("adminDashboard");
  const [formState, setFormState] = useState<LoginFormState>({
    username: "",
    password: "",
  });
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loginState, setLoginState] = useState<LoginStatus>("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreSession = (raw: string | null, storage: Storage) => {
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as AdminSession;
        if (parsed?.token) {
          setSession(parsed);
          return true;
        }
      } catch {
        storage.removeItem(SESSION_KEY);
      }
      return false;
    };

    const storedPreference = window.localStorage.getItem(REMEMBER_KEY);
    if (storedPreference === "true") {
      setRememberMe(true);
    }

    const hasLocalSession = restoreSession(
      window.localStorage.getItem(SESSION_KEY),
      window.localStorage
    );
    if (hasLocalSession) {
      if (storedPreference !== "true") {
        setRememberMe(true);
      }
      return;
    }

    restoreSession(window.sessionStorage.getItem(SESSION_KEY), window.sessionStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (session) {
      const payload = JSON.stringify(session);
      if (rememberMe) {
        window.localStorage.setItem(SESSION_KEY, payload);
        window.sessionStorage.removeItem(SESSION_KEY);
      } else {
        window.sessionStorage.setItem(SESSION_KEY, payload);
        window.localStorage.removeItem(SESSION_KEY);
      }
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [session, rememberMe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (rememberMe) {
      window.localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }
  }, [rememberMe]);

  useEffect(() => {
    if (loginState !== "success") return;
    const timer = setTimeout(() => setLoginState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [loginState]);

  const handleFieldChange = useCallback((field: keyof LoginFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRememberChange = useCallback((value: boolean) => {
    setRememberMe(value);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formState.username.trim() || !formState.password) {
        setLoginState("error");
        setLoginError(t("login.messages.missingCredentials"));
        return;
      }

      setLoginState("submitting");
      setLoginError(null);

      try {
        const response = await fetch("/api/restaurant-admin/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formState.username.trim(),
            password: formState.password,
          }),
        });
        const data = (await response.json().catch(() => null)) as AdminLoginResponse;

        const isSuccess = response.ok && data?.ok === true && !!data.token;

        if (!isSuccess) {
          const errorMessage =
            (isAdminLoginError(data) && (data.error || data.message)) ||
            `Unable to log in (status ${response.status}).`;
          throw new Error(errorMessage);
        }

        const nextSession: AdminSession = {
          token: data.token,
          admin: data.admin,
          restaurant: data.restaurant,
          loggedAt: new Date().toISOString(),
        };
        setSession(nextSession);
        setLoginState("success");
      } catch (error) {
        setLoginState("error");
        setLoginError(
          error instanceof Error ? error.message : t("login.messages.genericError")
        );
      }
    },
    [formState, t]
  );

  const handleLogout = useCallback(() => {
    setSession(null);
    setLoginState("idle");
    setFormState({ username: "", password: "" });
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t("header.eyebrow")}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{t("header.title")}</h1>
              <p className="mt-2 text-base text-slate-600">
                {t("header.subtitle")}
              </p>
            </div>
            {session && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white cursor-pointer"
              >
                {t("header.logout")}
              </button>
            )}
          </div>
        </header>

        {session ? (
          <Dashboard session={session} />
        ) : (
          <LoginPanel
            formState={formState}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            status={loginState}
            error={loginError}
            rememberMe={rememberMe}
            onRememberChange={handleRememberChange}
          />
        )}
      </div>
    </div>
  );
}

type LoginPanelProps = {
  formState: LoginFormState;
  onChange: (field: keyof LoginFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  status: LoginStatus;
  error: string | null;
  rememberMe: boolean;
  onRememberChange: (checked: boolean) => void;
};

function LoginPanel({
  formState,
  onChange,
  onSubmit,
  status,
  error,
  rememberMe,
  onRememberChange,
}: LoginPanelProps) {
  const t = useTranslations("adminDashboard");
  const isLoading = status === "submitting";
  const statusMessage =
    status === "success"
      ? t("login.messages.success")
      : status === "error"
      ? error
      : null;

  return (
    <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="admin-username" className="text-sm font-medium text-slate-700">
            {t("login.labels.username")}
          </label>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder={'username'}
            value={formState.username}
            onChange={(event) => onChange("username", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">
            {t("login.labels.password")}
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={'password'}
            value={formState.password}
            onChange={(event) => onChange("password", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="admin-remember"
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600"
          >
            <input
              id="admin-remember"
              name="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberChange(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            {t("login.labels.remember")}
          </label>
        </div>

        {statusMessage && (
          <div
            className={clsx(
              "rounded-2xl px-4 py-3 text-sm",
              status === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800"
            )}
          >
            {statusMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            "w-full rounded-2xl px-4 py-3 text-base font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isLoading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-slate-900 hover:bg-slate-800 cursor-pointer"
          )}
        >
          {isLoading ? t("login.buttons.submitting") : t("login.buttons.submit")}
        </button>
      </form>
    </section>
  );
}

type DashboardProps = {
  session: AdminSession;
};

function Dashboard({ session }: DashboardProps) {
  const t = useTranslations("adminDashboard");
  const { admin, restaurant } = session;

  const creditStats = useMemo(() => {
    const credits = restaurant.aiCredits ?? {};
    const used = Number(credits.used ?? 0);
    const remaining = Number(credits.remaining ?? 0);
    const total = used + remaining;
    const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;
    const remainingPercent = total > 0 ? Math.round((remaining / total) * 100) : 0;
    return { used, remaining, total, usagePercent, remainingPercent };
  }, [restaurant.aiCredits]);

  const assistantNames = useMemo(() => {
    const normalized = restaurant.aiAssistantName ?? {};
    return Object.entries(normalized).reduce<[string, string][]>((list, [locale, value]) => {
      if (typeof value === "string" && value.trim().length > 0) {
        list.push([locale, value]);
      }
      return list;
    }, []);
  }, [restaurant.aiAssistantName]);
  const assistantPrimaryName =
    assistantNames[0]?.[1] ??
    restaurant.name ??
    t("assistantPhoto.fallbackName");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
        <div className="grid gap-6 md:grid-cols-[1.5fr,1fr]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {restaurant.imageUrl ? (
              <Image
                src={restaurant.imageUrl}
                alt={restaurant.name ?? t("restaurantCard.title")}
                width={160}
                height={160}
                sizes="160px"
                className="h-32 w-32 rounded-3xl object-cover shadow-md"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                {t("restaurantCard.noImage")}
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-wider text-slate-400">
                {t("restaurantCard.title")}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {restaurant.name ?? t("restaurantCard.unnamed")}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  label={
                    restaurant.isActive === false
                      ? t("restaurantCard.badges.disabled")
                      : t("restaurantCard.badges.active")
                  }
                  variant={restaurant.isActive === false ? "warning" : "success"}
                />
                <StatusBadge
                  label={
                    restaurant.aiEnabled === false
                      ? t("restaurantCard.badges.aiDisabled")
                      : t("restaurantCard.badges.aiEnabled")
                  }
                  variant={restaurant.aiEnabled === false ? "neutral" : "success"}
                />
                {restaurant.plan && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {t("restaurantCard.planLabel", {
                      plan: toTitle(restaurant.plan),
                    })}
                  </span>
                )}
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-500">{t("restaurantCard.fields.slug")}</dt>
                  <dd className="text-slate-900">{restaurant.slug ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">{t("restaurantCard.fields.timezone")}</dt>
                  <dd className="text-slate-900">
                    {restaurant.timezone ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">{t("restaurantCard.fields.created")}</dt>
                  <dd className="text-slate-900">
                    {formatDateTime(restaurant.createdAt, restaurant.timezone)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">{t("restaurantCard.fields.updated")}</dt>
                  <dd className="text-slate-900">
                    {formatDateTime(restaurant.updatedAt, restaurant.timezone)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {t("adminCard.title")}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {admin.name ?? admin.username}
            </h3>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-500">{t("adminCard.fields.username")}</dt>
                <dd className="text-slate-900">{admin.username}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t("adminCard.fields.status")}</dt>
                <dd>
                  <StatusBadge
                    label={
                      admin.isActive === false
                        ? t("adminCard.badges.suspended")
                        : t("adminCard.badges.active")
                    }
                    variant={admin.isActive === false ? "warning" : "success"}
                  />
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs uppercase tracking-widest text-slate-400">
              {t("adminCard.fields.sessionStarted")}
            </p>
            <p className="text-sm text-slate-700">
              {formatDateTime(session.loggedAt)}
            </p>
          </div>
        </div>
      </section>

      <AiCreditsCard stats={creditStats} currency={restaurant.currency} />

      <div className="grid gap-6 md:grid-cols-2">
        <AssistantNamesCard entries={assistantNames} />
        <AssistantPortraitCard name={assistantPrimaryName} />
      </div>

      <TopViewedItemsPanel session={session} />
      <RestaurantFeedbackPanel session={session} />
      <MenuItemsPanel session={session} />
    </div>
  );
}

type AiCreditsCardProps = {
  stats: {
    used: number;
    remaining: number;
    total: number;
    usagePercent: number;
    remainingPercent: number;
  };
  currency?: string | null;
};

function AiCreditsCard({ stats, currency }: AiCreditsCardProps) {
  const t = useTranslations("adminDashboard");
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t("creditsCard.title")}
          </p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.remaining}{" "}
            <span className="text-base text-slate-500">{t("creditsCard.remainingSuffix")}</span>
          </h3>
        </div>
        {currency && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {t("creditsCard.currencyChip", { currency })}
          </span>
        )}
      </div>
      <div className="mt-6 space-y-3 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>{t("creditsCard.usedLabel")}</span>
          <span>{stats.used}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span>{t("creditsCard.remainingLabel")}</span>
          <span>{stats.remainingPercent}%</span>
        </div>
        <p className="text-xs text-slate-500">
          {t("creditsCard.hint", { total: stats.total })}
        </p>
      </div>
    </section>
  );
}

type AssistantNamesCardProps = {
  entries: [string, string][];
};

function AssistantNamesCard({ entries }: AssistantNamesCardProps) {
  const t = useTranslations("adminDashboard");
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        {t("assistantNames.title")}
      </p>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("assistantNames.empty")}</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {entries.map(([locale, name]) => (
            <div key={locale} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">
                {locale.toUpperCase()} · {getLanguageLabel(locale)}
              </dt>
              <dd className="text-base font-semibold text-slate-900">{name}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function AssistantPortraitCard({ name }: { name: string }) {
  const t = useTranslations("adminDashboard.assistantPhoto");
  return (
    <section className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t("title")}
        </p>
      </div>
      <div className="mt-6 flex justify-center">
        <Image
          src={assistantIllustration}
          alt={t("alt", { name })}
          width={200}
          height={200}
          className="h-40 w-40 max-w-full select-none drop-shadow-lg"
          priority={false}
        />
      </div>
    </section>
  );
}

type TopViewedPanelProps = {
  session: AdminSession;
};

type TopViewedItem = {
  _id: string;
  name?: LocalizedValue;
  price?: number | null;
  views?: number | null;
  image?: {
    url?: string;
  };
};

function TopViewedItemsPanel({ session }: TopViewedPanelProps) {
  const t = useTranslations("adminDashboard.topViewed");
  const locale = useLocale();
  const restaurantId = session.restaurant._id;
  const currency = session.restaurant.currency ?? "MKD";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TopViewedItem[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const fetchTopViewed = async () => {
      setStatus("loading");
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "5" });
        const response = await fetch(
          `/api/menuItems/${restaurantId}/menu-items/top-viewed?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            cache: "no-store",
          }
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message = payload?.error ?? `Request failed (${response.status})`;
          throw new Error(message);
        }
        const data = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        if (!cancelled) {
          setItems(
            data.map((entry:any) => ({
              _id: entry?._id ?? entry?.id ?? "",
              name: entry?.name,
              price: entry?.price ?? null,
              views: entry?.views ?? entry?.totalViews ?? null,
              image: entry?.image,
            }))
          );
          setStatus("success");
        }
      } catch (fetchError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            fetchError instanceof Error ? fetchError.message : t("error")
          );
        }
      }
    };
    fetchTopViewed();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, session.token, t]);

  if (!restaurantId) return null;

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t("title")}
          </p>
          <p className="mt-1 text-base text-slate-600">{t("subtitle")}</p>
        </div>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-slate-500">{t("loading")}</p>
      )}

      {status === "error" && (
        <p className="mt-6 text-sm text-rose-600">{error ?? t("error")}</p>
      )}

      {status === "success" && (
        <>
          {items.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
              {t("empty")}
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {items.map((item, index) => {
                const name =
                  resolveLocalizedText(item.name, locale as Locale) ??
                  t("unknown");
                const priceLabel = formatPrice(item.price, currency, locale ?? "mk");
                const viewsLabel = numberFormatter.format(item.views ?? 0);
                return (
                  <div
                    key={item._id || index}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-500">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {priceLabel ?? t("priceUnknown")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {t("viewsLabel")}
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {viewsLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

type FeedbackPanelProps = {
  session: AdminSession;
};

type FeedbackSummary = {
  total: number;
  avgFood: number;
  avgService: number;
};

const EMPTY_FEEDBACK_SUMMARY: FeedbackSummary = {
  total: 0,
  avgFood: 0,
  avgService: 0,
};

function RestaurantFeedbackPanel({ session }: FeedbackPanelProps) {
  const t = useTranslations("adminDashboard.feedback");
  const restaurantId = session.restaurant._id;
  const timezone = session.restaurant.timezone ?? undefined;
  const [items, setItems] = useState<RestaurantFeedbackEntry[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary>(EMPTY_FEEDBACK_SUMMARY);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setLoadingMore] = useState(false);

  const fetchFeedback = useCallback(
    async (cursorParam?: string) => {
      if (!restaurantId) {
        throw new Error("Missing restaurant identifier.");
      }
      const params = new URLSearchParams({ limit: "6" });
      if (cursorParam) params.set("cursor", cursorParam);

      const response = await fetch(
        `/api/restaurant-admin/restaurants/${restaurantId}/feedback?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
          cache: "no-store",
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok === false) {
        const message =
          payload?.error ||
          payload?.message ||
          `Request failed (${response.status})`;
        throw new Error(message);
      }

      const dataBlock = (payload?.data ?? payload) as {
        items?: unknown;
        summary?: Partial<FeedbackSummary>;
        nextCursor?: string | null;
      };

      const rawItems = Array.isArray(dataBlock?.items)
        ? dataBlock.items
        : Array.isArray(payload)
        ? payload
        : [];

      const cleanedItems: RestaurantFeedbackEntry[] = rawItems.map(
        (entry: any, index: number) => ({
          _id: String(entry?._id ?? entry?.id ?? `${Date.now()}-${index}`),
          foodRating: Number(entry?.foodRating ?? 0),
          serviceRating: Number(entry?.serviceRating ?? 0),
          suggestion:
            typeof entry?.suggestion === "string" ? entry.suggestion : "",
          submittedFrom:
            typeof entry?.submittedFrom === "string" ? entry.submittedFrom : "",
          createdAt: entry?.createdAt ?? null,
        })
      );

      const normalizedSummary: FeedbackSummary = dataBlock?.summary
        ? {
            total: Number(dataBlock.summary.total ?? 0),
            avgFood: Number(dataBlock.summary.avgFood ?? 0),
            avgService: Number(dataBlock.summary.avgService ?? 0),
          }
        : EMPTY_FEEDBACK_SUMMARY;

      const next = dataBlock?.nextCursor ?? payload?.nextCursor ?? null;

      return { items: cleanedItems, summary: normalizedSummary, nextCursor: next };
    },
    [restaurantId, session.token]
  );

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const loadFeedback = async () => {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchFeedback();
        if (cancelled) return;
        setItems(data.items);
        setSummary(data.summary ?? EMPTY_FEEDBACK_SUMMARY);
        setNextCursor(data.nextCursor ?? null);
        setStatus("success");
      } catch (fetchError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            fetchError instanceof Error ? fetchError.message : t("error")
          );
        }
      }
    };
    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [fetchFeedback, restaurantId, t]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchFeedback(nextCursor);
      setItems((previous) => [...previous, ...data.items]);
      setSummary(data.summary ?? EMPTY_FEEDBACK_SUMMARY);
      setNextCursor(data.nextCursor ?? null);
      setStatus("success");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t("error"));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, fetchFeedback, t]);

  if (!restaurantId) return null;

  const isEmpty = status === "success" && items.length === 0;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t("title")}
          </p>
          <p className="mt-1 text-base text-slate-600">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <FeedbackSummaryCard
            label={t("avgFood")}
            value={summary.avgFood.toFixed(1)}
          />
          <FeedbackSummaryCard
            label={t("avgService")}
            value={summary.avgService.toFixed(1)}
          />
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t("total", { count: summary.total })}
          </div>
        </div>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-slate-500">{t("loading")}</p>
      )}

      {status === "error" && (
        <p className="mt-6 text-sm text-rose-600">{error ?? t("error")}</p>
      )}

      {isEmpty && (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
          {t("empty")}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-6 space-y-4">
          {items.map((entry) => (
            <article
              key={entry._id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t("submittedAt", {
                      value: formatDateTime(entry.createdAt, timezone),
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] shadow-sm">
                    {t("ratingLabel", {
                      type: t("ratingTypes.food"),
                      value: entry.foodRating ?? 0,
                    })}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] shadow-sm">
                    {t("ratingLabel", {
                      type: t("ratingTypes.service"),
                      value: entry.serviceRating ?? 0,
                    })}
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("suggestionLabel")}
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-800">
                  {entry.suggestion?.trim() || t("suggestionEmpty")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {nextCursor && status === "success" && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className={clsx(
            "mt-6 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition",
            isLoadingMore
              ? "cursor-wait border-slate-100 text-slate-400"
              : "cursor-pointer border-slate-200 text-slate-700 hover:border-slate-300"
          )}
        >
          {isLoadingMore ? `${t("loadMore")}…` : t("loadMore")}
        </button>
      )}
    </section>
  );
}

type MenuItemsPanelProps = {
  session: AdminSession;
};

function MenuItemsPanel({ session }: MenuItemsPanelProps) {
  const t = useTranslations("adminDashboard.menuItems");
  const locale = useLocale() as Locale;
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "food" | "drink">("all");
  const [page, setPage] = useState<{ food: number; drink: number }>({ food: 1, drink: 1 });
  const restaurantId = session.restaurant._id;
  const timezone = session.restaurant.timezone ?? undefined;
  const currency = session.restaurant.currency ?? "MKD";
  const sessionToken = session.token;

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const fetchItems = async () => {
      setStatus("loading");
      setError(null);
      try {
        const response = await fetch(
          `/api/restaurant-admin/restaurants/${restaurantId}/menu-items`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          }
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message = payload?.error ?? `Request failed (${response.status})`;
          throw new Error(message);
        }
        const records = (
          Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.items)
            ? payload.items
            : []
        ) as AdminMenuItem[];
        if (!cancelled) {
          setItems(records);
          setStatus("success");
        }
      } catch (fetchError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load menu items."
          );
        }
      }
    };

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, session.token]);

  useEffect(() => {
    setPage({ food: 1, drink: 1 });
  }, [search, filter]);

  const normalizedItems = useMemo(() => {
    // Keep hidden items in the list so pagination doesn't jump when toggling visibility.
    return items.slice();
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedItems;
    return normalizedItems.filter((item) => {
      const name = resolveLocalizedText(item.name, locale)?.toLowerCase();
      const description = resolveLocalizedText(item.description, locale)?.toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";
      return (
        (name && name.includes(query)) ||
        (description && description.includes(query)) ||
        (tags && tags.includes(query))
      );
    });
  }, [normalizedItems, search, locale]);

  const groupedItems = useMemo(() => {
    const drinkItems = filteredItems.filter((item) =>
      (item.mealType ?? item.kind ?? "").toLowerCase().includes("drink")
    );
    const foodItems = filteredItems.filter(
      (item) => !(item.mealType ?? item.kind ?? "").toLowerCase().includes("drink")
    );
    return { food: foodItems, drink: drinkItems };
  }, [filteredItems]);

  useEffect(() => {
    setPage((prev) => {
      let next = prev;
      (["food", "drink"] as const).forEach((key) => {
        const totalPages = Math.max(
          1,
          Math.ceil(groupedItems[key].length / MENU_ITEMS_PER_PAGE) || 1
        );
        if (prev[key] > totalPages) {
          if (next === prev) next = { ...prev };
          next[key] = totalPages;
        }
        if (prev[key] < 1) {
          if (next === prev) next = { ...prev };
          next[key] = 1;
        }
      });
      return next;
    });
  }, [groupedItems]);

  const handleItemUpdated = useCallback(
    (updatedItem: AdminMenuItem) => {
      setItems((previous) => {
        const index = previous.findIndex((entry) => entry._id === updatedItem._id);
        if (index === -1) return previous;
        const next = [...previous];
        next[index] = { ...previous[index], ...updatedItem };
        return next;
      });
    },
    [setItems]
  );

  const lastUpdated = useMemo(() => {
    const timestamps = items
      .map((item) => (item.updatedAt ? Date.parse(item.updatedAt) : null))
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  }, [items]);

  const filterOptions: Array<"all" | "food" | "drink"> = ["all", "food", "drink"];
  const activeGroups =
    filter === "all" ? (["food", "drink"] as const) : ([filter] as Array<"food" | "drink">);
  const isEmpty = status === "success" && filteredItems.length === 0;
  const totalCount = filteredItems.length;

  const handlePageChange = (group: "food" | "drink", nextPage: number) => {
    setPage((prev) => ({ ...prev, [group]: nextPage }));
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t("title")}
          </p>
          <p className="mt-1 text-base text-slate-600">{t("subtitle")}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>{t("meta.total", { count: totalCount })}</p>
          {lastUpdated && (
            <p>{t("meta.lastSynced", { value: formatDateTime(lastUpdated.toISOString(), timezone) })}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm text-slate-600">
          {t("searchLabel")}
          <div className="mt-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </label>
        <div className="flex gap-2">
          {filterOptions.map((option) => {
            const count =
              option === "all"
                ? totalCount
                : option === "food"
                ? groupedItems.food.length
                : groupedItems.drink.length;
            const isActive = filter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={clsx(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition cursor-pointer",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                )}
              >
                {t(`filters.${option}`)}{" "}
                <span className="text-xs font-normal text-current">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {status === "loading" && (
        <p className="mt-6 text-sm text-slate-500">{t("loading")}</p>
      )}

      {status === "error" && (
        <p className="mt-6 text-sm text-rose-600">
          {error ?? t("errors.generic")}
        </p>
      )}

      {isEmpty && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-base font-semibold text-slate-900">{t("empty.title")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("empty.description")}</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            {t("empty.reset")}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {activeGroups.map((key) => (
          <MenuItemsGroup
            key={key}
            mealType={key}
            title={t(`groups.${key}.title`)}
            items={groupedItems[key]}
            page={page[key]}
            onPageChange={(nextPage) => handlePageChange(key, nextPage)}
            locale={locale}
            currency={currency}
            timezone={timezone}
            sessionToken={sessionToken}
            onItemUpdated={handleItemUpdated}
          />
        ))}
      </div>
    </section>
  );
}

type MenuItemsGroupProps = {
  title: string;
  items: AdminMenuItem[];
  mealType: "food" | "drink";
  page: number;
  onPageChange: (next: number) => void;
  locale: Locale;
  currency?: string | null;
  timezone?: string | null;
  sessionToken: string;
  onItemUpdated: (item: AdminMenuItem) => void;
};

function MenuItemsGroup({
  title,
  items,
  page,
  onPageChange,
  locale,
  currency,
  timezone,
  sessionToken,
  onItemUpdated,
}: MenuItemsGroupProps) {
  const t = useTranslations("adminDashboard.menuItems");
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
        {t("groups.empty")}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(items.length / MENU_ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * MENU_ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, startIndex + MENU_ITEMS_PER_PAGE);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {title} <span className="text-sm font-normal text-slate-500">({items.length})</span>
        </h3>
      </div>
      <div className="mt-4 grid gap-3">
        {visibleItems.map((item) => (
          <MenuItemCard
            key={item._id}
            item={item}
            locale={locale}
            currency={currency}
            timezone={timezone}
            sessionToken={sessionToken}
            onItemUpdated={onItemUpdated}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={clsx(
              "rounded-full border px-3 py-1 font-semibold transition",
              currentPage === 1
                ? "cursor-not-allowed border-slate-100 text-slate-300"
                : "border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
            )}
          >
            {t("pagination.prev")}
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("pagination.pageLabel", { page: currentPage, total: totalPages })}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={clsx(
              "rounded-full border px-3 py-1 font-semibold transition",
              currentPage === totalPages
                ? "cursor-not-allowed border-slate-100 text-slate-300"
                : "border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
            )}
          >
            {t("pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}

type MenuItemCardProps = {
  item: AdminMenuItem;
  locale: Locale;
  currency?: string | null;
  timezone?: string | null;
  sessionToken: string;
  onItemUpdated: (item: AdminMenuItem) => void;
};

function MenuItemCard({
  item,
  locale,
  currency,
  timezone,
  sessionToken,
  onItemUpdated,
}: MenuItemCardProps) {
  const t = useTranslations("adminDashboard.menuItems");
  const resolvedName = resolveLocalizedText(item.name, locale) ?? t("card.unknownName");
  const resolvedDescription = resolveLocalizedText(item.description, locale);
  const category = resolveLocalizedText(item.categoryId?.name, locale);
  const subcategory = resolveLocalizedText(item.subcategoryId?.name, locale);
  const priceLabel = formatPrice(item.price, currency, locale);
  const updatedLabel =
    item.updatedAt && t("card.updated", { value: formatDateTime(item.updatedAt, timezone) });
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(resolvedName);
  const [draftDescription, setDraftDescription] = useState(resolvedDescription ?? "");
  const [draftPrice, setDraftPrice] = useState(
    typeof item.price === "number" ? String(item.price) : ""
  );
  const [draftShouldDisplay, setDraftShouldDisplay] = useState(
    item.shouldBeDisplayed !== false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncDraftsFromItem = useCallback(() => {
    setDraftName(resolvedName);
    setDraftDescription(resolvedDescription ?? "");
    setDraftPrice(typeof item.price === "number" ? String(item.price) : "");
    setDraftShouldDisplay(item.shouldBeDisplayed !== false);
  }, [resolvedName, resolvedDescription, item.price, item.shouldBeDisplayed]);

  useEffect(() => {
    if (!isEditing) {
      syncDraftsFromItem();
    }
  }, [isEditing, syncDraftsFromItem]);

  const currentDisplay = isEditing ? draftShouldDisplay : item.shouldBeDisplayed !== false;

  const handleStartEditing = () => {
    setSaveError(null);
    setIsEditing(true);
  };

  const handleToggleDisplay = () => {
    if (!isEditing || isSaving) return;
    setDraftShouldDisplay((prev) => !prev);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
    syncDraftsFromItem();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const trimmedName = draftName.trim();
    const trimmedDescription = draftDescription.trim();
    const priceValue = draftPrice.trim();
    const hasPrice = priceValue.length > 0;
    const parsedPrice = hasPrice ? Number(priceValue) : null;

    if (hasPrice && Number.isNaN(parsedPrice)) {
      setIsSaving(false);
      setSaveError(t("card.invalidPrice"));
      return;
    }

    const payload: Record<string, unknown> = {
      shouldBeDisplayed: draftShouldDisplay,
    };

    payload.price = hasPrice ? parsedPrice : null;

    if (trimmedName.length > 0) {
      payload.name = buildLocalizedRecord(item.name, locale, trimmedName);
    }

    if (trimmedDescription.length > 0) {
      payload.description = buildLocalizedRecord(item.description, locale, trimmedDescription);
    }

    try {
      const response = await fetch(`/api/restaurant-admin/menu-items/${item._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (isPlainObject<{ error?: string }>(data) && typeof data.error === "string" && data.error) ||
          t("card.updateError");
        throw new Error(message);
      }
      const updated = extractMenuItemFromResponse(data) ?? {
        ...item,
        price: payload.price as number | null | undefined,
        shouldBeDisplayed: draftShouldDisplay,
        name: "name" in payload ? (payload.name as LocalizedValue) : item.name,
        description: "description" in payload ? (payload.description as LocalizedValue) : item.description,
      };
      onItemUpdated(updated);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("card.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const nameForDisplay = isEditing ? draftName : resolvedName;
  const descriptionForDisplay = isEditing ? draftDescription : resolvedDescription;

  return (
    <article className="flex flex-col md:flex-row gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      {item.image?.url ? (
        <Image
          src={item.image.url}
          alt={resolveLocalizedText(
            { mk: item.image.altMk, sq: item.image.altSq, en: item.image.altEn },
            locale
          ) ?? resolvedName}
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl object-cover shadow"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900/5 text-sm font-semibold text-slate-500">
          {resolvedName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex flex-col md:flex-wrap items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={nameForDisplay}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <textarea
                  value={descriptionForDisplay ?? ""}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </>
            ) : (
              <>
                <h4 className="text-base font-semibold text-slate-900">{nameForDisplay}</h4>
                {descriptionForDisplay && (
                  <p className="text-sm text-slate-600 line-clamp-2">{descriptionForDisplay}</p>
                )}
              </>
            )}
          </div>
          <div className="min-w-[7rem] text-sm font-semibold text-slate-700">
            {isEditing ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                {t("card.priceLabel")}
                <input
                  type="number"
                  inputMode="decimal"
                  value={draftPrice}
                  onChange={(event) => setDraftPrice(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder={currency ?? "MKD"}
                />
              </label>
            ) : (
              <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                {priceLabel ?? t("card.priceUnavailable")}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {category && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {category}
            </span>
          )}
          {subcategory && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {subcategory}
            </span>
          )}
          {Array.isArray(item.tags) &&
            item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {tag}
              </span>
            ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          {updatedLabel && <p>{updatedLabel}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={currentDisplay}
              disabled={!isEditing || isSaving}
              onClick={handleToggleDisplay}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-3 py-1 font-semibold transition",
                currentDisplay
                  ? "border-emerald-500 text-emerald-700"
                  : "border-slate-200 text-slate-500",
                (!isEditing || isSaving) && "cursor-not-allowed opacity-50",
                isEditing && !isSaving && "cursor-pointer"
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-4 w-8 items-center rounded-full bg-slate-200 transition",
                  currentDisplay && "bg-emerald-500"
                )}
              >
                <span
                  className={clsx(
                    "ml-0.5 inline-block h-3 w-3 rounded-full bg-white shadow transition",
                    currentDisplay && "translate-x-4"
                  )}
                />
              </span>
              {currentDisplay ? t("card.displayed") : t("card.hidden")}
            </button>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1 font-semibold text-white transition",
                    isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  )}
                >
                  {isSaving ? t("card.saving") : t("card.save")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 font-semibold text-slate-700 transition hover:border-slate-300",
                    isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                >
                  {t("card.cancel")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition hover:border-slate-300 cursor-pointer"
              >
                <PencilLine className="h-3.5 w-3.5" />
                {t("card.edit")}
              </button>
            )}
          </div>
        </div>
        {saveError && (
          <p className="mt-2 text-xs text-rose-600">
            {saveError}
          </p>
        )}
      </div>
    </article>
  );
}

function resolveLocalizedText(value: LocalizedValue, locale: Locale) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value[locale] ?? value.mk ?? value.en ?? value.sq ?? undefined;
}

function formatPrice(amount?: number | null, currency?: string | null, localeCode?: string) {
  if (typeof amount !== "number") return null;
  try {
    return new Intl.NumberFormat(localeCode ?? "en", {
      style: "currency",
      currency: currency ?? "MKD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount}${currency ? ` ${currency}` : ""}`;
  }
}

function isPlainObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown
): value is T {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function buildLocalizedRecord(
  original: LocalizedValue,
  locale: Locale,
  nextValue: string
): Partial<Record<string, string>> {
  const base = isPlainObject<Partial<Record<string, string>>>(original) ? { ...original } : {};
  base[locale] = nextValue;
  return base;
}

function extractMenuItemFromResponse(payload: unknown): AdminMenuItem | null {
  if (isMenuItemShape(payload)) {
    return payload;
  }
  if (isPlainObject<Record<string, unknown>>(payload)) {
    if ("data" in payload) {
      const fromData = extractMenuItemFromResponse(payload.data);
      if (fromData) return fromData;
    }
    if ("item" in payload) {
      const fromItem = extractMenuItemFromResponse(payload.item);
      if (fromItem) return fromItem;
    }
  }
  return null;
}

function isMenuItemShape(value: unknown): value is AdminMenuItem {
  return (
    isPlainObject<{ _id?: unknown }>(value) &&
    typeof value._id === "string"
  );
}

function FeedbackSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "success" | "warning" | "neutral";
}) {
  const className = clsx(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    variant === "success" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    variant === "warning" && "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    variant === "neutral" && "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
  );
  return <span className={className}>{label}</span>;
}

function formatDateTime(iso?: string | null, timeZone?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZone ?? undefined,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function toTitle(value?: string | null) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLanguageLabel(code: string) {
  return LANGUAGE_LABELS[code.toLowerCase()] ?? "Unknown";
}
