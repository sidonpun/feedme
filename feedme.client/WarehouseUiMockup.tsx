import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { cloneElement, createContext, forwardRef, isValidElement, useContext, useEffect, useMemo, useRef, useState } from "react";

type SupplyRow = {
  id: string;
  shipmentDate: string;
  number: string;
  supplier: string;
  positions: number;
  amount: string;
  status: "В обработке" | "Доставлено" | "Отменено";
};

const supplies: SupplyRow[] = [
  {
    id: "supply-1",
    shipmentDate: "12.03.2025",
    number: "RN-58231",
    supplier: "ООО \"ГлавСнаб\"",
    positions: 24,
    amount: "18\u202f720 ₽",
    status: "В обработке",
  },
  {
    id: "supply-2",
    shipmentDate: "11.03.2025",
    number: "RN-58218",
    supplier: "АО \"ФудЛайн\"",
    positions: 12,
    amount: "9\u202f360 ₽",
    status: "Доставлено",
  },
  {
    id: "supply-3",
    shipmentDate: "10.03.2025",
    number: "RN-58197",
    supplier: "ООО \"ФрешМаркет\"",
    positions: 31,
    amount: "27\u202f450 ₽",
    status: "В обработке",
  },
  {
    id: "supply-4",
    shipmentDate: "08.03.2025",
    number: "RN-58144",
    supplier: "ООО \"Поставка+\"",
    positions: 7,
    amount: "5\u202f120 ₽",
    status: "Отменено",
  },
];

type WarehouseUiMockupProps = HTMLAttributes<HTMLDivElement>;

export function WarehouseUiMockup({ className, ...rest }: WarehouseUiMockupProps) {
  return (
    <div
      className={["flex flex-col gap-6", "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Поставки</h2>
          <p className="text-sm text-slate-500">
            Управляйте поступающими поставками и отслеживайте статус по каждому документу.
          </p>
        </div>
        <Button type="button" variant="primary">
          Новая поставка
        </Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Накладная</TableHead>
              <TableHead>Поставщик</TableHead>
              <TableHead className="text-right">Позиций</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.shipmentDate}</TableCell>
                <TableCell>
                  <span className="font-medium text-slate-900">{row.number}</span>
                </TableCell>
                <TableCell>{row.supplier}</TableCell>
                <TableCell className="text-right text-slate-900">{row.positions}</TableCell>
                <TableCell className="text-right text-slate-900">{row.amount}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="w-[44px]">
                  <ActionMenu supplyNumber={row.number} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type StatusBadgeProps = {
  status: SupplyRow["status"];
};

function StatusBadge({ status }: StatusBadgeProps) {
  const baseStyles = "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium";

  switch (status) {
    case "Доставлено":
      return (
        <span className={[baseStyles, "border-emerald-200 bg-emerald-50 text-emerald-700"].join(" ")}>
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          Доставлено
        </span>
      );
    case "Отменено":
      return (
        <span className={[baseStyles, "border-rose-200 bg-rose-50 text-rose-700"].join(" ")}>
          <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
          Отменено
        </span>
      );
    default:
      return (
        <span className={[baseStyles, "border-amber-200 bg-amber-50 text-amber-700"].join(" ")}>
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
          В обработке
        </span>
      );
  }
}

type ActionMenuProps = {
  supplyNumber: string;
};

function ActionMenu({ supplyNumber }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Открыть меню действий для ${supplyNumber}`}
        >
          <span aria-hidden className="text-xl leading-none">⋯</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>Открыть</DropdownMenuItem>
        <DropdownMenuItem>Редактировать</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-600">
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "default" | "icon";

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BUTTON_BASE_CLASSES =
  "relative inline-flex select-none items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: "h-10 px-4",
  icon: "h-10 w-10",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "default", className, children, type = "button", ...props },
  ref,
) {
  const classes = [BUTTON_BASE_CLASSES, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});

const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table
    className={["w-full border-collapse text-left text-sm text-slate-700", className].filter(Boolean).join(" ")}
    {...props}
  />
);

const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={["bg-slate-50", className].filter(Boolean).join(" ")} {...props} />
);

const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={["bg-white", className].filter(Boolean).join(" ")} {...props} />
);

const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={["border-b border-slate-100 last:border-0 hover:bg-slate-50", className].filter(Boolean).join(" ")}
    {...props}
  />
);

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={[
      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:rounded-tl-xl last:rounded-tr-xl",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
);

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={["px-4 py-4 align-middle text-sm text-slate-600", className].filter(Boolean).join(" ")} {...props} />
);

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string) {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error(`${component} must be used within a <DropdownMenu>`);
  }

  return context;
}

type DropdownMenuProps = {
  children: ReactNode;
};

function DropdownMenuProvider({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const value = useMemo<DropdownMenuContextValue>(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((previous) => !previous),
    }),
    [open],
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div ref={containerRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenu({ children }: DropdownMenuProps) {
  return <DropdownMenuProvider>{children}</DropdownMenuProvider>;
}

type DropdownMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(function DropdownMenuTrigger(
  { className, asChild = false, onClick, children, ...props },
  ref,
) {
  const context = useDropdownMenuContext("DropdownMenuTrigger");

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event as never);
    event.stopPropagation();
    context.toggle();
  };

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error("DropdownMenuTrigger with asChild requires a single React element child");
    }

    const child = children as ReactElement;
    const mergedClassName = [child.props.className, "cursor-pointer", className].filter(Boolean).join(" ");
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      handleToggle(event);
    };

    return cloneElement(child, {
      ...props,
      ref,
      onClick: handleClick,
      "aria-haspopup": "menu",
      "aria-expanded": context.open,
      className: mergedClassName,
    });
  }

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      className={["cursor-pointer", className].filter(Boolean).join(" ")}
      aria-haspopup="menu"
      aria-expanded={context.open}
      onClick={handleToggle as React.MouseEventHandler<HTMLButtonElement>}
    >
      {children}
    </button>
  );
});

type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end";
};

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(function DropdownMenuContent(
  { className, align = "start", style, ...props },
  ref,
) {
  const context = useDropdownMenuContext("DropdownMenuContent");

  if (!context.open) {
    return null;
  }

  const alignmentClass = align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div
      {...props}
      ref={ref}
      role="menu"
      style={{ minWidth: "10rem", ...style }}
      className={[
        "absolute z-50 mt-2 rounded-lg border border-slate-200 bg-white p-1 text-slate-700 shadow-lg",
        "focus:outline-none",
        alignmentClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
});

type DropdownMenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(function DropdownMenuItem(
  { className, onClick, type = "button", ...props },
  ref,
) {
  const context = useDropdownMenuContext("DropdownMenuItem");

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    context.setOpen(false);
  };

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      role="menuitem"
      className={[
        "flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm",
        "text-slate-600 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleClick}
    />
  );
});

const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="separator"
    className={["my-1 h-px bg-slate-200", className].filter(Boolean).join(" ")}
    {...props}
  />
);

export {
  ActionMenu,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
