import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SupplyStatus = "ok" | "scheduled" | "delayed";

type Supply = {
  id: string;
  arrivalDate: string;
  warehouse: string;
  responsible: string;
  sku: string;
  name: string;
  quantity: number;
  expirationDate: string;
  supplier: string;
  status: SupplyStatus;
};

const SUPPLIES: Supply[] = [
  {
    id: "PR-000984",
    arrivalDate: "2025-09-26",
    warehouse: "Главный склад",
    responsible: "Иванов И.",
    sku: "MEAT-001",
    name: "Курица охлажд.",
    quantity: 120,
    expirationDate: "2025-10-03",
    supplier: "ООО Куры Дуры",
    status: "ok",
  },
  {
    id: "PR-000985",
    arrivalDate: "2025-09-26",
    warehouse: "Главный склад",
    responsible: "Петров П.",
    sku: "VEG-011",
    name: "Лук репчатый",
    quantity: 35,
    expirationDate: "2025-10-15",
    supplier: "ОвощБаза",
    status: "scheduled",
  },
  {
    id: "PR-000986",
    arrivalDate: "2025-09-25",
    warehouse: "Ресторан",
    responsible: "Смирнова А.",
    sku: "BEV-004",
    name: "Сок яблочный",
    quantity: 60,
    expirationDate: "2026-02-01",
    supplier: "ООО Фрукты",
    status: "ok",
  },
  {
    id: "PR-000987",
    arrivalDate: "2025-09-24",
    warehouse: "Ресторан",
    responsible: "Сидоров В.",
    sku: "DAIRY-002",
    name: "Сыр пармезан",
    quantity: 18,
    expirationDate: "2026-03-12",
    supplier: "Cheese&Co",
    status: "delayed",
  },
];

type DropdownContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  registerTrigger: (node: HTMLButtonElement | null) => void;
  registerContent: (node: HTMLDivElement | null) => void;
};

const DropdownMenuContext = React.createContext<DropdownContextValue | null>(
  null,
);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(
      "Dropdown menu components must be rendered inside <DropdownMenu>",
    );
  }
  return context;
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (instance: T | null) => void {
  return (instance) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }
      if (typeof ref === "function") {
        ref(instance);
        return;
      }
      // eslint-disable-next-line no-param-reassign -- mergeRefs mutates ref objects
      (ref as React.MutableRefObject<T | null>).current = instance;
    });
  };
}

type DropdownMenuProps = PropsWithChildren<{
  onOpenChange?: (open: boolean) => void;
}>;

function DropdownMenu({ children, onOpenChange }: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    setOpen((current) => {
      onOpenChange?.(!current);
      return !current;
    });
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        close();
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, close]);

  const value = useMemo<DropdownContextValue>(
    () => ({
      open,
      toggle,
      close,
      registerTrigger: (node) => {
        triggerRef.current = node;
      },
      registerContent: (node) => {
        contentRef.current = node;
      },
    }),
    [open, toggle, close],
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-flex">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

type DropdownMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(function DropdownMenuTriggerComponent(
  { onClick, ...props },
  forwardedRef,
) {
  const { open, toggle, registerTrigger } = useDropdownMenu();
  const composedRef = useMemo(
    () => mergeRefs(forwardedRef, registerTrigger),
    [forwardedRef, registerTrigger],
  );

  const handleClick = useCallback<
    NonNullable<DropdownMenuTriggerProps["onClick"]>
  >(
    (event) => {
      event.preventDefault();
      toggle();
      onClick?.(event);
    },
    [toggle, onClick],
  );

  return (
    <button
      type="button"
      {...props}
      ref={composedRef}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={handleClick}
    />
  );
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

type DropdownMenuContentProps = PropsWithChildren<{
  className?: string;
}>;

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(function DropdownMenuContentComponent(
  { className = "", children },
  forwardedRef,
) {
  const { open, registerContent } = useDropdownMenu();
  const composedRef = useMemo(
    () => mergeRefs(forwardedRef, registerContent),
    [forwardedRef, registerContent],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      ref={composedRef}
      role="menu"
      className={`absolute right-0 mt-2 min-w-[176px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 ${className}`.trim()}
    >
      {children}
    </div>
  );
});

DropdownMenuContent.displayName = "DropdownMenuContent";

type DropdownMenuItemProps = PropsWithChildren<{
  onSelect?: () => void;
  destructive?: boolean;
}>;

function DropdownMenuItem({
  children,
  onSelect,
  destructive = false,
}: DropdownMenuItemProps) {
  const { close } = useDropdownMenu();

  const handleClick = useCallback(() => {
    onSelect?.();
    close();
  }, [onSelect, close]);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        destructive
          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />;
}

const statusConfig: Record<SupplyStatus, { label: string; className: string }> = {
  ok: { label: "Ок", className: "bg-emerald-100 text-emerald-700" },
  scheduled: {
    label: "Запланировано",
    className: "bg-blue-100 text-blue-700",
  },
  delayed: {
    label: "Задерживается",
    className: "bg-red-100 text-red-700",
  },
};

function StatusBadge({ status }: { status: SupplyStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function RowActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xl text-zinc-500 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Открыть меню строки"
      >
        <span aria-hidden>⋯</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Открыть</DropdownMenuItem>
        <DropdownMenuItem>Редактировать</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>Удалить</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SuppliesTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm text-zinc-700 dark:divide-zinc-800 dark:text-zinc-200">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">№ док.</th>
              <th className="px-4 py-3 text-left font-medium">Дата прихода</th>
              <th className="px-4 py-3 text-left font-medium">Склад</th>
              <th className="px-4 py-3 text-left font-medium">Ответственный</th>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Название</th>
              <th className="px-4 py-3 text-right font-medium">Кол-во</th>
              <th className="px-4 py-3 text-center font-medium">Срок годности</th>
              <th className="px-4 py-3 text-left font-medium">Поставщик</th>
              <th className="px-4 py-3 text-left font-medium">Статус</th>
              <th className="w-[44px] px-1 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {SUPPLIES.map((supply) => (
              <tr
                key={supply.id}
                className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {supply.id}
                </td>
                <td className="px-4 py-3">{supply.arrivalDate}</td>
                <td className="px-4 py-3">{supply.warehouse}</td>
                <td className="px-4 py-3">{supply.responsible}</td>
                <td className="px-4 py-3">{supply.sku}</td>
                <td className="px-4 py-3">{supply.name}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {supply.quantity}
                </td>
                <td className="px-4 py-3 text-center">{supply.expirationDate}</td>
                <td className="px-4 py-3">{supply.supplier}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={supply.status} />
                </td>
                <td className="w-[44px] px-1 py-3 text-right">
                  <RowActionsMenu />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <span>Показано {SUPPLIES.length} поставки</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Назад
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarehouseUiMockup() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Поставки
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Последние поставки и действия с ними.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Экспорт
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              + Новая поставка
            </button>
          </div>
        </header>
        <SuppliesTable />
      </div>
    </div>
  );
}
