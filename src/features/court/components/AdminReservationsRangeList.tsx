'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useReservationsRange,
  type ReservationRangeEvent,
} from '@/features/court/hooks/useReservationsRange';
import { useCalendarDay } from '@/features/court/hooks/useCalendarDay';

const HOY = new Date();

type ViewMode = 'week' | 'month';
type SortMode = 'startAsc' | 'startDesc' | 'clientAsc' | 'estadoAsc';
type DerivedEstado = 'pending' | 'reserved' | 'confirmed' | 'cancelled' | 'paid';
type EstadoFilter = 'all' | DerivedEstado;

type ReservationLike = ReservationRangeEvent & Record<string, unknown>;

function getStringField(ev: ReservationLike, keys: string[]) {
  for (const key of keys) {
    const value = ev[key];

    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }

  return '';
}

function getNumberField(ev: ReservationLike, keys: string[]) {
  for (const key of keys) {
    const value = ev[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function getRawPaymentStatus(ev: ReservationLike) {
  return getStringField(ev, [
    'paymentStatus',
    'payment_state',
    'payment',
    'statusPayment',
  ]);
}

function normalizePaymentStatus(value?: string | null) {
  const paymentStatus = String(value ?? '')
    .trim()
    .toLowerCase();

  if (
    [
      'paid',
      'pagado',
      'pagada',
      'approved',
      'aprobado',
      'aprobada',
      'completed',
      'completado',
      'completada',
    ].includes(paymentStatus)
  ) {
    return 'paid';
  }

  if (['pending', 'pendiente'].includes(paymentStatus)) {
    return 'pending';
  }

  return '';
}

function normalizeEstado(value?: string | null) {
  const estado = String(value ?? '')
    .trim()
    .toLowerCase();

  if (['pending', 'pendiente'].includes(estado)) return 'pending';
  if (['reserved', 'reservado', 'reservada'].includes(estado)) return 'reserved';
  if (['confirmed', 'confirmado', 'confirmada'].includes(estado)) return 'confirmed';
  if (['cancelled', 'cancelado', 'cancelada'].includes(estado)) return 'cancelled';
  if (['paid', 'pagado', 'pagada'].includes(estado)) return 'paid';

  return 'pending';
}

function getDerivedEstado(ev: ReservationLike): DerivedEstado {
  const paymentStatus = normalizePaymentStatus(getRawPaymentStatus(ev));
  if (paymentStatus === 'paid') return 'paid';

  return normalizeEstado(String(ev.estado ?? '')) as DerivedEstado;
}

function getEstadoLabelFromValue(estado: DerivedEstado) {
  if (estado === 'paid') return 'Pagado';
  if (estado === 'confirmed') return 'Confirmado';
  if (estado === 'reserved') return 'Reservado';
  if (estado === 'cancelled') return 'Cancelado';
  return 'Pendiente';
}

function getEstadoLabel(ev: ReservationLike) {
  return getEstadoLabelFromValue(getDerivedEstado(ev));
}

function getEstadoBadgeClassFromValue(estado: DerivedEstado) {
  if (estado === 'paid') {
    return 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200';
  }

  if (estado === 'confirmed') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (estado === 'reserved') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200';
  }

  if (estado === 'cancelled') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
  }

  return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
}

function getEstadoBadgeClass(ev: ReservationLike) {
  return getEstadoBadgeClassFromValue(getDerivedEstado(ev));
}

function getClientName(ev: ReservationLike) {
  return (
    getStringField(ev, [
      'customerName',
      'clientName',
      'name',
      'fullName',
      'userName',
      'contactName',
    ]) || String(ev.title ?? 'Sin título')
  );
}

function getPhone(ev: ReservationLike) {
  return getStringField(ev, [
    'customerPhone',
    'phoneNumber',
    'phone',
    'cellphone',
    'celular',
    'telefono',
    'mobile',
    'whatsapp',
  ]);
}

function getCourtLabel(ev: ReservationLike) {
  return (
    getStringField(ev, ['courtTitle', 'courtName', 'resourceTitle']) ||
    `Cancha ${String(ev.resourceId ?? '-')}`
  );
}

function getPaymentStatus(ev: ReservationLike) {
  const raw = getRawPaymentStatus(ev);
  const normalized = normalizePaymentStatus(raw);

  if (normalized === 'paid') return 'Pagado';
  if (normalized === 'pending') return 'Pendiente';

  return raw || '—';
}

function getPaymentMethod(ev: ReservationLike) {
  return (
    getStringField(ev, [
      'paymentMethod',
      'paymentType',
      'payment_method',
      'method',
    ]) || '—'
  );
}

function getAmount(ev: ReservationLike) {
  return getNumberField(ev, [
    'priceApplied',
    'amount',
    'total',
    'price',
    'importe',
    'monto',
  ]);
}

function getCurrency(ev: ReservationLike) {
  return (
    getStringField(ev, ['currencyApplied', 'currency', 'moneda']).toUpperCase() || 'CLP'
  );
}

function getNotes(ev: ReservationLike) {
  return getStringField(ev, [
    'notes',
    'note',
    'observations',
    'observation',
    'comment',
    'comments',
    'description',
  ]);
}

function formatDateTime(value: Date) {
  return format(value, 'dd/MM/yyyy HH:mm');
}

function formatOnlyDate(value: Date) {
  return format(value, 'dd/MM/yyyy');
}

function formatOnlyTime(value: Date) {
  return format(value, 'HH:mm');
}

function formatMoney(amount: number, currency = 'CLP') {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('es-CL')} ${currency}`;
  }
}

function normalizeCourtType(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function AdminReservationsRangeList() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(HOY);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('all');

  const [canchaId, setCanchaId] = useState<string>('1');
  const [search, setSearch] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('startAsc');
  const [selectedReservation, setSelectedReservation] = useState<ReservationLike | null>(
    null,
  );
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const fromCalc =
      viewMode === 'week'
        ? startOfWeek(anchorDate, { locale: es, weekStartsOn: 1 })
        : startOfMonth(anchorDate);

    const toCalc =
      viewMode === 'week'
        ? endOfWeek(anchorDate, { locale: es, weekStartsOn: 1 })
        : endOfMonth(anchorDate);

    return { from: fromCalc, to: toCalc };
  }, [viewMode, anchorDate]);

  const { courts } = useCalendarDay({
    date: anchorDate,
    source: 'api',
    maxCourts: 100,
  });

  const { events, loading, error } = useReservationsRange({
    from,
    to,
    estado: estadoFilter,
    canchaId,
  });

  const rangeLabel =
    viewMode === 'week'
      ? `${format(from, "dd 'de' MMM", { locale: es })} - ${format(
          to,
          "dd 'de' MMM yyyy",
          { locale: es },
        )}`
      : format(from, 'MMMM yyyy', { locale: es });

  const allCourtOptions = useMemo(() => {
    const map = new Map<string, string>();

    courts.forEach((court) => {
      const id = String(court.id);
      const label = `${normalizeCourtType(court.type)} - ${court.title}`;
      map.set(id, label);
    });

    (events as ReservationLike[]).forEach((ev) => {
      const id = String(ev.resourceId ?? '');
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, getCourtLabel(ev));
      }
    });

    if (!map.size) {
      map.set('1', 'Cancha 1');
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [courts, events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = (events as ReservationLike[]).filter((ev) => {
      const client = getClientName(ev).toLowerCase();
      const phone = getPhone(ev).toLowerCase();
      const title = String(ev.title ?? '').toLowerCase();
      const court = getCourtLabel(ev).toLowerCase();
      const notes = getNotes(ev).toLowerCase();
      const derivedEstado = getDerivedEstado(ev);

      const matchesSearch =
        !normalizedSearch ||
        client.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        title.includes(normalizedSearch) ||
        court.includes(normalizedSearch) ||
        notes.includes(normalizedSearch);

      const matchesExactDate = !exactDate || format(ev.start, 'yyyy-MM-dd') === exactDate;
      const matchesEstado = estadoFilter === 'all' || derivedEstado === estadoFilter;

      return matchesSearch && matchesExactDate && matchesEstado;
    });

    result.sort((a, b) => {
      if (sortMode === 'startDesc') {
        return b.start.getTime() - a.start.getTime();
      }

      if (sortMode === 'clientAsc') {
        return getClientName(a).localeCompare(getClientName(b), 'es');
      }

      if (sortMode === 'estadoAsc') {
        return getEstadoLabel(a).localeCompare(getEstadoLabel(b), 'es');
      }

      return a.start.getTime() - b.start.getTime();
    });

    return result;
  }, [events, search, exactDate, sortMode, estadoFilter]);

  const stats = useMemo(() => {
    const total = filteredEvents.length;

    const paidEvents = filteredEvents.filter((ev) => getDerivedEstado(ev) === 'paid');
    const paid = paidEvents.length;
    const totalPaid = paidEvents.reduce((sum, ev) => sum + getAmount(ev), 0);
    const totalPaidCurrency =
      paidEvents.find((ev) => !!getCurrency(ev))?.currencyApplied ?? 'CLP';

    const confirmed = filteredEvents.filter(
      (ev) => getDerivedEstado(ev) === 'confirmed',
    ).length;

    const cancelled = filteredEvents.filter(
      (ev) => getDerivedEstado(ev) === 'cancelled',
    ).length;

    return { total, paid, totalPaid, totalPaidCurrency, confirmed, cancelled };
  }, [filteredEvents]);

  const moveRange = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setAnchorDate((prev) =>
        direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1),
      );
      return;
    }

    setAnchorDate((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  const goToday = () => {
    setAnchorDate(HOY);
    setExactDate('');
  };

  const clearFilters = () => {
    setEstadoFilter('all');
    setCanchaId('1');
    setSearch('');
    setExactDate('');
    setSortMode('startAsc');
    setSelectedReservation(null);
  };

  const handleCopyPhone = async (ev: ReservationLike) => {
    const phone = getPhone(ev);
    if (!phone) return;

    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(String(ev.id));
      window.setTimeout(() => {
        setCopiedPhoneId((current) => (current === String(ev.id) ? null : current));
      }, 1400);
    } catch {
      // sin acción
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Reservas
              </p>
              <h2 className="text-xl font-semibold capitalize text-zinc-900">
                {rangeLabel}
              </h2>
              <p className="text-sm text-zinc-500">
                Consulta por rango, filtra rápido y revisa el detalle sin salir del
                listado.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={
                    'rounded-lg px-3 py-1.5 text-sm transition ' +
                    (viewMode === 'week'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-white')
                  }
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={
                    'rounded-lg px-3 py-1.5 text-sm transition ' +
                    (viewMode === 'month'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-white')
                  }
                >
                  Mes
                </button>
              </div>

              <button
                type="button"
                onClick={() => moveRange('prev')}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={goToday}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => moveRange('next')}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.total}</p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p className="text-xs text-indigo-700">Pagadas</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-800">{stats.paid}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">Reservadas</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">
                {stats.confirmed}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs text-rose-700">Canceladas</p>
              <p className="mt-1 text-2xl font-semibold text-rose-800">{stats.cancelled}</p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs text-green-700">Total cobrado</p>
              <p className="mt-1 text-xl font-semibold text-green-800">
                {formatMoney(stats.totalPaid, stats.totalPaidCurrency)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Buscar
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                placeholder="Nombre, teléfono, título, cancha o nota"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Estado
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="reserved">Reservado</option>
                <option value="confirmed">Confirmado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Cancha
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                value={canchaId}
                onChange={(e) => setCanchaId(e.target.value)}
              >
                {allCourtOptions.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Fecha exacta
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                value={exactDate}
                onChange={(e) => setExactDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Ordenar por
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="startAsc">Fecha ascendente</option>
                <option value="startDesc">Fecha descendente</option>
                <option value="clientAsc">Cliente A-Z</option>
                <option value="estadoAsc">Estado A-Z</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 md:w-auto"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Listado de reservas</h3>
              <p className="text-xs text-zinc-500">
                {filteredEvents.length} resultado{filteredEvents.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="h-[calc(100%-57px)] overflow-auto">
            {loading && (
              <div className="p-4 text-sm text-zinc-500">Cargando reservas...</div>
            )}

            {error && (
              <div className="p-4 text-sm text-rose-600">
                Error cargando reservas: {error}
              </div>
            )}

            {!loading && !error && filteredEvents.length === 0 && (
              <div className="p-4 text-sm text-zinc-500">
                No hay reservas con los filtros actuales.
              </div>
            )}

            {!loading && !error && filteredEvents.length > 0 && (
              <div className="min-w-[1180px]">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-zinc-50">
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="px-3 py-3 text-left font-medium">Estado</th>
                      <th className="px-3 py-3 text-left font-medium">Cliente / reserva</th>
                      <th className="px-3 py-3 text-left font-medium">Celular</th>
                      <th className="px-3 py-3 text-left font-medium">Cancha</th>
                      <th className="px-3 py-3 text-left font-medium">Inicio</th>
                      <th className="px-3 py-3 text-left font-medium">Fin</th>
                      <th className="px-3 py-3 text-left font-medium">Pago</th>
                      <th className="px-3 py-3 text-left font-medium">Monto</th>
                      <th className="px-3 py-3 text-left font-medium">Notas</th>
                      <th className="px-3 py-3 text-left font-medium">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEvents.map((ev) => {
                      const isActive = selectedReservation?.id === ev.id;
                      const phone = getPhone(ev);
                      const notes = getNotes(ev);
                      const amount = getAmount(ev);
                      const currency = getCurrency(ev);

                      return (
                        <tr
                          key={String(ev.id)}
                          className={
                            'border-b border-zinc-100 align-top transition hover:bg-zinc-50 ' +
                            (isActive ? 'bg-zinc-50' : '')
                          }
                        >
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoBadgeClass(
                                ev,
                              )}`}
                            >
                              {getEstadoLabel(ev)}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-900">
                                {getClientName(ev)}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {String(ev.title ?? 'Sin título')}
                              </span>
                              <span className="mt-1 text-[11px] text-zinc-400">
                                ID #{String(ev.id)}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            {phone ? (
                              <div className="flex flex-col gap-2">
                                <span className="font-medium text-zinc-800">{phone}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(ev)}
                                  className="w-fit rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                                >
                                  {copiedPhoneId === String(ev.id) ? 'Copiado' : 'Copiar'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-zinc-700">{getCourtLabel(ev)}</td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-900">
                                {formatOnlyDate(ev.start)}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {formatOnlyTime(ev.start)}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-900">
                                {formatOnlyDate(ev.end)}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {formatOnlyTime(ev.end)}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-800">
                                {getPaymentStatus(ev)}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {getPaymentMethod(ev)}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="font-medium text-zinc-800">
                              {amount > 0 ? formatMoney(amount, currency) : '—'}
                            </span>
                          </td>

                          <td className="max-w-[220px] px-3 py-3">
                            <div className="truncate text-zinc-600" title={notes || '—'}>
                              {notes || '—'}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedReservation(ev)}
                                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                              >
                                Ver detalle
                              </button>

                              {phone ? (
                                <a
                                  href={`tel:${phone}`}
                                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-center text-xs text-zinc-700 hover:bg-zinc-50"
                                >
                                  Llamar
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="cursor-not-allowed rounded-lg border border-zinc-100 px-3 py-1.5 text-xs text-zinc-400"
                                >
                                  Sin celular
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="min-h-0 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Detalle rápido</h3>
            <p className="text-xs text-zinc-500">
              Selecciona una fila para ver más información.
            </p>
          </div>

          <div className="h-[calc(100%-57px)] overflow-auto p-4">
            {!selectedReservation ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                Todavía no has seleccionado una reserva.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoBadgeClass(
                      selectedReservation,
                    )}`}
                  >
                    {getEstadoLabel(selectedReservation)}
                  </span>

                  <h4 className="mt-3 text-lg font-semibold text-zinc-900">
                    {getClientName(selectedReservation)}
                  </h4>
                  <p className="text-sm text-zinc-500">
                    {String(selectedReservation.title ?? 'Sin título')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Cancha</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {getCourtLabel(selectedReservation)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Inicio</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {formatDateTime(selectedReservation.start)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Fin</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {formatDateTime(selectedReservation.end)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Celular</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {getPhone(selectedReservation) || 'No disponible'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Pago</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {getPaymentStatus(selectedReservation)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      Método: {getPaymentMethod(selectedReservation)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Monto</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {getAmount(selectedReservation) > 0
                        ? formatMoney(
                            getAmount(selectedReservation),
                            getCurrency(selectedReservation),
                          )
                        : 'No disponible'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Notas</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
                      {getNotes(selectedReservation) || 'Sin observaciones'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getPhone(selectedReservation) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(selectedReservation)}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        {copiedPhoneId === String(selectedReservation.id)
                          ? 'Celular copiado'
                          : 'Copiar celular'}
                      </button>

                      <a
                        href={`tel:${getPhone(selectedReservation)}`}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        Llamar
                      </a>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setSelectedReservation(null)}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Cerrar detalle
                  </button>
                </div>

                {exactDate && isSameDay(selectedReservation.start, new Date(exactDate)) && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                    Esta reserva coincide con la fecha exacta filtrada.
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}