"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, BellRing, ReceiptText, RefreshCw, Soup } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { io, type Socket } from "socket.io-client";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import AdminPwaInstallButton from "@/app/_components/AdminPwaInstallButton";
import {
  extractApiData,
  type LocalizedValue,
  type RestaurantOrder,
  type RestaurantOrderStatus,
  type RestaurantServiceRequest,
  type RestaurantServiceRequestStatus,
  type RestaurantServiceRequestType,
} from "@/app/lib/restaurantOperations";

type AdminUser = {
  username: string;
  name?: LocalizedValue;
};

type AdminRestaurant = {
  _id?: string;
  name?: LocalizedValue;
  slug?: string | null;
  timezone?: string | null;
};

type AdminSession = {
  token: string;
  admin: AdminUser;
  restaurant: AdminRestaurant;
  loggedAt: string;
};

const SESSION_KEY = "smart-menu::restaurant-admin-session";
const ADMIN_TOKEN_KEY = "restaurantAdminToken";
const POLL_INTERVAL_MS = 10_000;
const SOCKET_EVENT_ORDER_NEW = "order:new";
const SOCKET_EVENT_ORDER_UPDATED = "order:updated";
const SOCKET_EVENT_SERVICE_REQUEST_NEW = "service-request:new";
const SOCKET_EVENT_SERVICE_REQUEST_UPDATED = "service-request:updated";
const HIGHLIGHT_DURATION_MS = 9_000;

export default function AdminRestaurantOrdersPage() {
  const t = useTranslations("adminOperations");
  const locale = useLocale() as Locale;
  const adminDashboardHref = buildLocalizedPath("/admin-restaurant", locale);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<RestaurantServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderPendingIds, setOrderPendingIds] = useState<Record<string, boolean>>({});
  const [servicePendingIds, setServicePendingIds] = useState<Record<string, boolean>>({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentOrderIds, setRecentOrderIds] = useState<Record<string, boolean>>({});
  const [recentServiceRequestIds, setRecentServiceRequestIds] = useState<Record<string, boolean>>({});
  const highlightTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreSession = (raw: string | null) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as AdminSession;
        const token = window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? parsed?.token;
        return token ? { ...parsed, token } : null;
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        return null;
      }
    };

    setSession(restoreSession(window.localStorage.getItem(SESSION_KEY)));
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(highlightTimeoutsRef.current)) {
        window.clearTimeout(timeoutId);
      }
      highlightTimeoutsRef.current = {};
    };
  }, []);

  const restaurantId = session?.restaurant._id;
  const timezone = session?.restaurant.timezone ?? undefined;
  const restaurantName = resolveLocalizedText(session?.restaurant.name, locale) ?? "Restaurant";

  const markRecent = useCallback(
    (kind: "order" | "service", id: string) => {
      const timeoutKey = `${kind}:${id}`;

      if (highlightTimeoutsRef.current[timeoutKey]) {
        window.clearTimeout(highlightTimeoutsRef.current[timeoutKey]);
      }

      if (kind === "order") {
        setRecentOrderIds((current) => ({ ...current, [id]: true }));
      } else {
        setRecentServiceRequestIds((current) => ({ ...current, [id]: true }));
      }

      highlightTimeoutsRef.current[timeoutKey] = window.setTimeout(() => {
        if (kind === "order") {
          setRecentOrderIds((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        } else {
          setRecentServiceRequestIds((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        }

        delete highlightTimeoutsRef.current[timeoutKey];
      }, HIGHLIGHT_DURATION_MS);
    },
    []
  );

  const handleSessionExpired = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setSession(null);
    setError(t("errors.sessionExpired"));
  }, [t]);

  const loadData = useCallback(async () => {
    if (!session?.token || !restaurantId) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const [ordersResponse, serviceRequestsResponse] = await Promise.all([
        fetch(
          `/api/restaurant-admin/restaurants/${restaurantId}/orders?status=new,accepted,preparing`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            cache: "no-store",
          }
        ),
        fetch(
          `/api/restaurant-admin/restaurants/${restaurantId}/service-requests?status=new,acknowledged`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            cache: "no-store",
          }
        ),
      ]);

      const ordersPayload = await ordersResponse.json().catch(() => null);
      const servicePayload = await serviceRequestsResponse.json().catch(() => null);

      if (ordersResponse.status === 401 || serviceRequestsResponse.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!ordersResponse.ok) {
        throw new Error(
          typeof ordersPayload?.error === "string"
            ? ordersPayload.error
            : t("errors.loadOrders")
        );
      }

      if (!serviceRequestsResponse.ok) {
        throw new Error(
          typeof servicePayload?.error === "string"
            ? servicePayload.error
            : t("errors.loadServiceRequests")
        );
      }

      setOrders(extractApiData<RestaurantOrder[]>(ordersPayload) ?? []);
      setServiceRequests(extractApiData<RestaurantServiceRequest[]>(servicePayload) ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired, restaurantId, session?.token, t]);

  useEffect(() => {
    if (!session?.token || !restaurantId) return;
    setLoading(true);
    void loadData();
  }, [loadData, restaurantId, session?.token]);

  useEffect(() => {
    if (!session?.token || !restaurantId) return;
    const intervalId = window.setInterval(() => {
      void loadData();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData, restaurantId, session?.token]);

  useEffect(() => {
    if (!session?.token || !restaurantId || typeof window === "undefined") return;

    const socketUrl = resolveSocketUrl();
    const socket: Socket = io(socketUrl, {
      auth: {
        token: session.token,
      },
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleOrderNew = (payload: unknown) => {
      const order = extractSocketData<RestaurantOrder>(payload);
      if (!order || order.restaurantId !== restaurantId) return;

      setOrders((current) => upsertById(current, order));
      markRecent("order", order._id);
      playNotificationTone("order");
    };

    const handleOrderUpdated = (payload: unknown) => {
      const order = extractSocketData<RestaurantOrder>(payload);
      if (!order || order.restaurantId !== restaurantId) return;

      setOrders((current) => upsertById(current, order));
    };

    const handleServiceRequestNew = (payload: unknown) => {
      const request = extractSocketData<RestaurantServiceRequest>(payload);
      if (!request || request.restaurantId !== restaurantId) return;

      setServiceRequests((current) => upsertById(current, request));
      markRecent("service", request._id);
      playNotificationTone("service");
    };

    const handleServiceRequestUpdated = (payload: unknown) => {
      const request = extractSocketData<RestaurantServiceRequest>(payload);
      if (!request || request.restaurantId !== restaurantId) return;

      setServiceRequests((current) => upsertById(current, request));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SOCKET_EVENT_ORDER_NEW, handleOrderNew);
    socket.on(SOCKET_EVENT_ORDER_UPDATED, handleOrderUpdated);
    socket.on(SOCKET_EVENT_SERVICE_REQUEST_NEW, handleServiceRequestNew);
    socket.on(SOCKET_EVENT_SERVICE_REQUEST_UPDATED, handleServiceRequestUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SOCKET_EVENT_ORDER_NEW, handleOrderNew);
      socket.off(SOCKET_EVENT_ORDER_UPDATED, handleOrderUpdated);
      socket.off(SOCKET_EVENT_SERVICE_REQUEST_NEW, handleServiceRequestNew);
      socket.off(SOCKET_EVENT_SERVICE_REQUEST_UPDATED, handleServiceRequestUpdated);
      socket.disconnect();
    };
  }, [markRecent, restaurantId, session?.token]);

  const orderGroups = useMemo(
    () => ({
      new: orders.filter((order) => order.status === "new"),
      accepted: orders.filter((order) => order.status === "accepted"),
      preparing: orders.filter((order) => order.status === "preparing"),
    }),
    [orders]
  );

  const serviceGroups = useMemo(
    () => ({
      new: serviceRequests.filter((request) => request.status === "new"),
      acknowledged: serviceRequests.filter(
        (request) => request.status === "acknowledged"
      ),
    }),
    [serviceRequests]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: RestaurantOrderStatus) => {
      if (!session?.token) return;
      setOrderPendingIds((current) => ({ ...current, [orderId]: true }));

      try {
        const response = await fetch(`/api/restaurant-admin/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });
        const payload = await response.json().catch(() => null);

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : t("errors.updateOrder")
          );
        }

        const updated = extractApiData<RestaurantOrder>(payload);
        if (updated) {
          setOrders((current) =>
            current.map((order) => (order._id === updated._id ? updated : order))
          );
        } else {
          await loadData();
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : t("errors.updateOrder"));
      } finally {
        setOrderPendingIds((current) => ({ ...current, [orderId]: false }));
      }
    },
    [handleSessionExpired, loadData, session?.token, t]
  );

  const updateServiceRequestStatus = useCallback(
    async (serviceRequestId: string, status: RestaurantServiceRequestStatus) => {
      if (!session?.token) return;
      setServicePendingIds((current) => ({ ...current, [serviceRequestId]: true }));

      try {
        const response = await fetch(
          `/api/restaurant-admin/service-requests/${serviceRequestId}/status`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${session.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          }
        );
        const payload = await response.json().catch(() => null);

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : t("errors.updateServiceRequest")
          );
        }

        const updated = extractApiData<RestaurantServiceRequest>(payload);
        if (updated) {
          setServiceRequests((current) =>
            current.map((request) =>
              request._id === updated._id ? updated : request
            )
          );
        } else {
          await loadData();
        }
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : t("errors.updateServiceRequest")
        );
      } finally {
        setServicePendingIds((current) => ({ ...current, [serviceRequestId]: false }));
      }
    },
    [handleSessionExpired, loadData, session?.token, t]
  );

  return (
    <div className="min-h-dvh bg-[#F5F7F6] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={adminDashboardHref}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToDashboard")}
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {restaurantName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="ml-auto flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
              <AdminPwaInstallButton
                labels={{
                  install: t("installApp.install"),
                  iosHelp: t("installApp.iosHelp"),
                  browserHelp: t("installApp.browserHelp"),
                  close: t("installApp.close"),
                }}
              />
              <div
                className={clsx(
                  "rounded-full px-3 py-2 text-xs font-semibold ring-1",
                  socketConnected
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                )}
              >
                {socketConnected ? t("socket.connected") : t("socket.fallback")}
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading || !session}
                className={clsx(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                  loading || !session
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                <RefreshCw className={clsx("h-4 w-4", loading ? "animate-spin" : "")} />
                {t("refresh")}
              </button>
            </div>
          </div>
        </header>

        {!sessionChecked ? (
          <EmptyStateCard title={t("states.loadingSession")} description={t("states.loadingSessionDescription")} />
        ) : !session ? (
          <EmptyStateCard
            title={t("states.loginRequired")}
            description={t("states.loginRequiredDescription")}
            actionLabel={t("states.openAdmin")}
            actionHref={adminDashboardHref}
          />
        ) : (
          <>
            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
              <section className="space-y-4">
                <SectionHeader
                  icon={Soup}
                  title={t("orders.title")}
                  subtitle={t("orders.subtitle")}
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  <OrderColumn
                    title={t("orders.columns.new")}
                    orders={orderGroups.new}
                    locale={locale}
                    timezone={timezone}
                    pendingIds={orderPendingIds}
                    recentIds={recentOrderIds}
                    onUpdateStatus={updateOrderStatus}
                  />
                  <OrderColumn
                    title={t("orders.columns.accepted")}
                    orders={orderGroups.accepted}
                    locale={locale}
                    timezone={timezone}
                    pendingIds={orderPendingIds}
                    recentIds={recentOrderIds}
                    onUpdateStatus={updateOrderStatus}
                  />
                  <OrderColumn
                    title={t("orders.columns.preparing")}
                    orders={orderGroups.preparing}
                    locale={locale}
                    timezone={timezone}
                    pendingIds={orderPendingIds}
                    recentIds={recentOrderIds}
                    onUpdateStatus={updateOrderStatus}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <SectionHeader
                  icon={BellRing}
                  title={t("serviceRequests.title")}
                  subtitle={t("serviceRequests.subtitle")}
                />
                <div className="grid gap-4">
                  <ServiceRequestColumn
                    title={t("serviceRequests.columns.new")}
                    requests={serviceGroups.new}
                    timezone={timezone}
                    pendingIds={servicePendingIds}
                    recentIds={recentServiceRequestIds}
                    onUpdateStatus={updateServiceRequestStatus}
                  />
                  <ServiceRequestColumn
                    title={t("serviceRequests.columns.acknowledged")}
                    requests={serviceGroups.acknowledged}
                    timezone={timezone}
                    pendingIds={servicePendingIds}
                    recentIds={recentServiceRequestIds}
                    onUpdateStatus={updateServiceRequestStatus}
                  />
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Soup;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section className="rounded-[28px] bg-white p-8 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

function OrderColumn({
  title,
  orders,
  locale,
  timezone,
  pendingIds,
  recentIds,
  onUpdateStatus,
}: {
  title: string;
  orders: RestaurantOrder[];
  locale: Locale;
  timezone?: string;
  pendingIds: Record<string, boolean>;
  recentIds: Record<string, boolean>;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => Promise<void>;
}) {
  const t = useTranslations("adminOperations");

  return (
    <div className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {orders.length}
        </span>
      </div>

      <div className="space-y-3">
        {orders.length ? (
          orders.map((order) => (
            <article
              key={order._id}
              className={clsx(
                "rounded-[24px] border p-4 transition-all duration-500",
                recentIds[order._id]
                  ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_44px_rgba(16,185,129,0.18)] ring-2 ring-emerald-200"
                  : "border-slate-200 bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">
                      {t("orders.table", { table: order.tableNumber })}
                    </p>
                    {recentIds[order._id] ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {t("orders.newBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(order.createdAt, timezone)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  {formatCurrency(order.subtotal, order.currency, locale)}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {order.items.map((item, index) => (
                  <li key={`${order._id}:${item.menuItemId}:${index}`} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-950">
                      {item.quantity}x {resolveLocalizedText(item.nameSnapshot, locale) ?? t("orders.unnamedItem")}
                    </span>
                    {item.note ? <span className="block text-xs text-slate-500">{item.note}</span> : null}
                  </li>
                ))}
              </ul>

              {order.guestNote ? (
                <p className="mt-4 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                  {t("orders.guestNote")}: {order.guestNote}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {getOrderActions(order.status).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={Boolean(pendingIds[order._id])}
                    onClick={() => void onUpdateStatus(order._id, nextStatus)}
                    className={clsx(
                      "cursor-pointer rounded-full px-3 py-2 text-xs font-semibold transition",
                      pendingIds[order._id]
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : getActionButtonClass(nextStatus)
                    )}
                  >
                    {t(`orders.actions.${nextStatus}`)}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t("orders.empty")}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceRequestColumn({
  title,
  requests,
  timezone,
  pendingIds,
  recentIds,
  onUpdateStatus,
}: {
  title: string;
  requests: RestaurantServiceRequest[];
  timezone?: string;
  pendingIds: Record<string, boolean>;
  recentIds: Record<string, boolean>;
  onUpdateStatus: (
    serviceRequestId: string,
    status: RestaurantServiceRequestStatus
  ) => Promise<void>;
}) {
  const t = useTranslations("adminOperations");

  return (
    <div className="rounded-[28px] bg-white p-4 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {requests.length}
        </span>
      </div>

      <div className="space-y-3">
        {requests.length ? (
          requests.map((request) => (
            <article
              key={request._id}
              className={clsx(
                "rounded-[24px] border p-4 transition-all duration-500",
                recentIds[request._id]
                  ? "border-amber-300 bg-amber-50 shadow-[0_18px_44px_rgba(245,158,11,0.18)] ring-2 ring-amber-200"
                  : "border-slate-200 bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">
                      {t("serviceRequests.table", { table: request.tableNumber })}
                    </p>
                    {recentIds[request._id] ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {t("serviceRequests.newBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(`serviceRequests.types.${request.type}`)}
                  </p>
                </div>
                <ReceiptText className="h-5 w-5 text-slate-400" />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {formatDateTime(request.createdAt, timezone)}
              </p>
              {request.note ? (
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                  {request.note}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {getServiceRequestActions(request.status).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={Boolean(pendingIds[request._id])}
                    onClick={() => void onUpdateStatus(request._id, nextStatus)}
                    className={clsx(
                      "cursor-pointer rounded-full px-3 py-2 text-xs font-semibold transition",
                      pendingIds[request._id]
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : getActionButtonClass(nextStatus)
                    )}
                  >
                    {t(`serviceRequests.actions.${nextStatus}`)}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t("serviceRequests.empty")}
          </div>
        )}
      </div>
    </div>
  );
}

function resolveLocalizedText(value: LocalizedValue, locale: Locale) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const direct = value[locale];
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  for (const candidate of Object.values(value)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function formatDateTime(value?: string | null, timezone?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("mk-MK", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: timezone || "Europe/Skopje",
  }).format(parsed);
}

function formatCurrency(amount: number, currency: string, locale: Locale) {
  const intlLocale =
    locale === "mk" ? "mk-MK" : locale === "sq" ? "sq-AL" : locale === "tr" ? "tr-TR" : "en-US";

  const formatter = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 0,
  });

  if (currency === "MKD" && locale !== "en") {
    return `${formatter.format(amount)} ден`;
  }

  return `${currency} ${formatter.format(amount)}`;
}

function getOrderActions(status: RestaurantOrderStatus): RestaurantOrderStatus[] {
  switch (status) {
    case "new":
      return ["accepted", "cancelled"];
    case "accepted":
      return ["preparing", "served", "cancelled"];
    case "preparing":
      return ["served", "cancelled"];
    default:
      return [];
  }
}

function getServiceRequestActions(
  status: RestaurantServiceRequestStatus
): RestaurantServiceRequestStatus[] {
  switch (status) {
    case "new":
      return ["acknowledged", "resolved", "cancelled"];
    case "acknowledged":
      return ["resolved", "cancelled"];
    default:
      return [];
  }
}

function getActionButtonClass(
  status: RestaurantOrderStatus | RestaurantServiceRequestStatus
) {
  if (status === "accepted" || status === "acknowledged") {
    return "bg-sky-100 text-sky-700 hover:bg-sky-200";
  }
  if (status === "preparing") {
    return "bg-amber-100 text-amber-700 hover:bg-amber-200";
  }
  if (status === "served" || status === "resolved") {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
  }
  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700 hover:bg-rose-200";
  }
  return "bg-slate-100 text-slate-700 hover:bg-slate-200";
}

function extractSocketData<T>(payload: unknown): T | null {
  return extractApiData<T>(payload);
}

function upsertById<T extends { _id: string; createdAt?: string }>(
  collection: T[],
  incoming: T
) {
  const next = collection.some((entry) => entry._id === incoming._id)
    ? collection.map((entry) => (entry._id === incoming._id ? incoming : entry))
    : [incoming, ...collection];

  return [...next].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function resolveSocketUrl() {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/$/, "") ?? null;

  if (configured) return configured;

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

let audioContextRef: AudioContext | null = null;

function playNotificationTone(kind: "order" | "service") {
  if (typeof window === "undefined") return;

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return;

  if (!audioContextRef) {
    audioContextRef = new AudioContextCtor();
  }

  const context = audioContextRef;
  if (context.state === "suspended") {
    void context.resume();
  }

  const notes =
    kind === "order"
      ? [
          { at: 0, frequency: 880, duration: 0.13, gain: 0.085 },
          { at: 0.16, frequency: 1174, duration: 0.18, gain: 0.09 },
        ]
      : [
          { at: 0, frequency: 740, duration: 0.11, gain: 0.075 },
          { at: 0.14, frequency: 880, duration: 0.14, gain: 0.08 },
          { at: 0.3, frequency: 740, duration: 0.14, gain: 0.07 },
        ];

  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = kind === "order" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(note.frequency, context.currentTime + note.at);
    gainNode.gain.setValueAtTime(0.001, context.currentTime + note.at);
    gainNode.gain.exponentialRampToValueAtTime(
      note.gain,
      context.currentTime + note.at + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + note.at + note.duration
    );
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(context.currentTime + note.at);
    oscillator.stop(context.currentTime + note.at + note.duration + 0.02);
  }
}
