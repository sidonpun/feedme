import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function WarehouseDesign() {
  const [tab, setTab] = useState("supplies");
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [openNewSupply, setOpenNewSupply] = useState(false);

  return (
    <div className="h-screen w-full grid grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="border-r p-4 space-y-6 overflow-y-auto">
        <div className="text-lg font-semibold">Rest.Name</div>
        <nav className="space-y-1">
          <div className="px-2 py-1.5 rounded-md text-sm bg-muted font-medium">Склад</div>
          <div className="px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/60">Заказы</div>
          <div className="px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/60">Касса</div>
          <div className="px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/60">Аналитика</div>
          <div className="px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/60">Настройки</div>
        </nav>
        <Separator className="my-4" />
      </aside>

      {/* Main */}
      <main className="min-w-0 h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="supplies">Поставки</TabsTrigger>
              <TabsTrigger value="stock">Остатки</TabsTrigger>
              <TabsTrigger value="catalog">Каталог</TabsTrigger>
              <TabsTrigger value="inventory">Инвентаризация</TabsTrigger>
            </TabsList>

            {/* Вкладка Поставки */}
            <TabsContent value="supplies" className="space-y-4">
              <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Input placeholder="Поиск по номеру, SKU или названию" className="w-[320px]" />
                  <Input type="date" className="w-[160px]" />
                  <Input type="date" className="w-[160px]" />
                  <Button variant="outline">Сброс</Button>
                  <Button variant="secondary">Экспорт</Button>
                  <Button onClick={() => setOpenNewSupply(true)}>+ Новая поставка</Button>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="py-3"><CardTitle className="text-base">Последние поставки</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/90 backdrop-blur border-b shadow-[inset_0_-1px_0_0_var(--border)]">
                      <TableRow>
                        <TableHead className="w-[40px]"><Checkbox /></TableHead>
                        <TableHead>№ док.</TableHead>
                        <TableHead>Дата прихода</TableHead>
                        <TableHead>Склад</TableHead>
                        <TableHead>Ответственный</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead className="text-right">Кол-во</TableHead>
                        <TableHead className="text-center">Срок годности</TableHead>
                        <TableHead>Поставщик</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-muted/40 odd:bg-muted/10 h-11 align-middle">
                        <TableCell><Checkbox /></TableCell>
                        <TableCell className="font-mono text-xs">PR-000984</TableCell>
                        <TableCell>2025-09-26</TableCell>
                        <TableCell>Главный склад</TableCell>
                        <TableCell>Иванов И.</TableCell>
                        <TableCell className="font-mono text-xs">MEAT-001</TableCell>
                        <TableCell className="truncate" title="Курица охлажд.">Курица охлажд.</TableCell>
                        <TableCell className="text-right">120</TableCell>
                        <TableCell className="text-center">2025-10-03</TableCell>
                        <TableCell className="truncate" title="ООО Куры Дуры">ООО Куры Дуры</TableCell>
                        <TableCell><Badge>Ок</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="flex items-center p-3 border-t text-sm bg-muted/40 shadow-sm">
                    <div className="text-muted-foreground">Показано 1 поставка</div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="outline" size="sm">Назад</Button>
                      <Button variant="outline" size="sm">Далее</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка Остатки */}
            <TabsContent value="stock" className="space-y-4">
              <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Input placeholder="Поиск по SKU или названию" className="w-[320px]" />
                  <Button variant="outline">Сброс</Button>
                  <Button variant="secondary">Экспорт</Button>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="py-3"><CardTitle className="text-base">Остатки по складам</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/90 backdrop-blur border-b shadow-[inset_0_-1px_0_0_var(--border)]">
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Склад</TableHead>
                        <TableHead className="text-right">Кол-во</TableHead>
                        <TableHead className="text-center">Срок годности</TableHead>
                        <TableHead>Поставщик</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-muted/40 odd:bg-muted/10 h-11 align-middle">
                        <TableCell className="font-mono text-xs">VEG-011</TableCell>
                        <TableCell>Лук репчатый</TableCell>
                        <TableCell>Овощи</TableCell>
                        <TableCell>Главный склад</TableCell>
                        <TableCell className="text-right">35</TableCell>
                        <TableCell className="text-center">2025-10-15</TableCell>
                        <TableCell>ОвощБаза</TableCell>
                        <TableCell><Badge variant="secondary">Скоро срок</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="flex items-center p-3 border-t text-sm bg-muted/40 shadow-sm">
                    <div className="text-muted-foreground">Показано 1 строка</div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="outline" size="sm">Назад</Button>
                      <Button variant="outline" size="sm">Далее</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка Каталог */}
            <TabsContent value="catalog" className="space-y-4">
              <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Input placeholder="Поиск по названию / SKU" className="w-[320px]" />
                  <Button variant="outline">Сброс</Button>
                  <Button onClick={() => setOpenNewProduct(true)}>+ Новый товар</Button>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="py-3"><CardTitle className="text-base">Каталог товаров</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/90 backdrop-blur border-b shadow-[inset_0_-1px_0_0_var(--border)]">
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Ед. изм.</TableHead>
                        <TableHead className="text-right">Цена</TableHead>
                        <TableHead>Поставщик</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Курица гриль</TableCell>
                        <TableCell>Заготовка</TableCell>
                        <TableCell>MEAT-003</TableCell>
                        <TableCell>Мясные</TableCell>
                        <TableCell>кг</TableCell>
                        <TableCell className="text-right">220 ₽</TableCell>
                        <TableCell>ООО Куры Дуры</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка Инвентаризация */}
            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  Здесь будет модуль инвентаризации. Пока заглушка.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog: Новый товар с вкладками */}
      <Dialog open={openNewProduct} onOpenChange={setOpenNewProduct}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Новый товар</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Основная информация</TabsTrigger>
              <TabsTrigger value="logistics">Закупка и логистика</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-3 pt-3">
              <Input placeholder="Название товара" />
              <Input placeholder="SKU" />
              <Input placeholder="Категория" />
              <Input placeholder="Единица измерения" />
              <Input placeholder="Вес/объем" />
              <Input placeholder="Метод списания" />
              <Input placeholder="Аллергены" />
              <div className="flex gap-2">
                <Checkbox /> <span className="text-sm">Требует фасовки</span>
              </div>
              <div className="flex gap-2">
                <Checkbox /> <span className="text-sm">Портится после вскрытия</span>
              </div>
            </TabsContent>
            <TabsContent value="logistics" className="space-y-3 pt-3">
              <Input placeholder="Поставщик (осн.)" />
              <Input placeholder="Срок поставки (дней)" />
              <Input placeholder="Оценочная себестоимость" />
              <Input placeholder="Ставка НДС" />
              <Input placeholder="Цена за единицу" />
              <Input placeholder="Цена продажи (опц.)" />
              <Input placeholder="Код ТН ВЭД" />
              <div className="flex gap-2">
                <Checkbox /> <span className="text-sm">Маркируемый товар</span>
              </div>
              <div className="flex gap-2">
                <Checkbox /> <span className="text-sm">Алкогольная продукция</span>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="pt-4">
            <Button variant="outline">Отмена</Button>
            <Button>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Новая поставка с вкладками */}
      <Dialog open={openNewSupply} onOpenChange={setOpenNewSupply}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Новая поставка</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="doc">
            <TabsList>
              <TabsTrigger value="doc">Детали документа</TabsTrigger>
              <TabsTrigger value="product">Товар</TabsTrigger>
              <TabsTrigger value="extra">Дополнительно</TabsTrigger>
            </TabsList>
            <TabsContent value="doc" className="space-y-3 pt-3">
              <Input placeholder="Номер документа" />
              <Input placeholder="Дата прихода" />
              <Input placeholder="Склад" />
              <Input placeholder="Ответственный" />
            </TabsContent>
            <TabsContent value="product" className="space-y-3 pt-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите товар из каталога" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEAT-001">Курица охлажд. (MEAT-001)</SelectItem>
                  <SelectItem value="MEAT-002">Говядина (MEAT-002)</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Количество" />
              <Input placeholder="Срок годности" />
            </TabsContent>
            <TabsContent value="extra" className="space-y-3 pt-3">
              <Input placeholder="Комментарий" />
              <div className="flex gap-2">
                <Checkbox /> <span className="text-sm">Прикрепить файл</span>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="pt-4">
            <Button variant="outline">Отмена</Button>
            <Button>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
