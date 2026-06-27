import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogTitle,
} from './alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion'
import { CommandDialog, CommandInput, CommandList } from './command'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './hover-card'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

describe('overlay and menu components', () => {
  it('opens and closes dialog and alert dialog surfaces', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <button type="button">Open dialog</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>姿态详情</DialogTitle>
            <DialogDescription>本地查看</DialogDescription>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button">Open alert</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>这一步会清空报告。</AlertDialogDescription>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>继续</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    expect(await screen.findByRole('dialog', { name: '姿态详情' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '姿态详情' })).not.toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: 'Open alert' }))
    expect(await screen.findByRole('alertdialog', { name: '确认删除' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: '确认删除' })).not.toBeInTheDocument()
    )
  })

  it('opens sheet and drawer panels', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <button type="button">Open sheet</button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle>侧边面板</SheetTitle>
            <SheetDescription>显示额外信息</SheetDescription>
            <SheetClose asChild>
              <button type="button">关闭面板</button>
            </SheetClose>
          </SheetContent>
        </Sheet>
        <Drawer>
          <DrawerTrigger asChild>
            <button type="button">Open drawer</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>底部抽屉</DrawerTitle>
              <DrawerDescription>移动端信息</DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <button type="button">关闭抽屉</button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      </div>
    )

    await user.click(screen.getByRole('button', { name: 'Open sheet' }))
    expect(await screen.findByRole('dialog', { name: '侧边面板' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭面板' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '侧边面板' })).not.toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: 'Open drawer' }))
    expect(await screen.findByRole('dialog', { name: '底部抽屉' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭抽屉' }))
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: '底部抽屉' })).toHaveAttribute('data-state', 'closed')
    )
  })

  it('shows popover, tooltip, and hover card content on hover or click', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open popover</button>
          </PopoverTrigger>
          <PopoverContent>Popover details</PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Hover tip</button>
          </TooltipTrigger>
          <TooltipContent>快捷提示</TooltipContent>
        </Tooltip>
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="/profile">Hover profile</a>
          </HoverCardTrigger>
          <HoverCardContent>Hover card details</HoverCardContent>
        </HoverCard>
      </div>
    )

    await user.click(screen.getByRole('button', { name: 'Open popover' }))
    expect(await screen.findByText('Popover details')).toBeInTheDocument()

    await user.hover(screen.getByRole('button', { name: 'Hover tip' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('快捷提示')

    await user.hover(screen.getByRole('link', { name: 'Hover profile' }))
    expect(await screen.findByText('Hover card details')).toBeInTheDocument()
  })

  it('exposes dropdown and context menu interactions', async () => {
    const user = userEvent.setup()

    function MenuDemo() {
      const [gridVisible, setGridVisible] = React.useState(true)
      const [alignment, setAlignment] = React.useState('left')
      const [contextPinned, setContextPinned] = React.useState(true)
      const [contextTone, setContextTone] = React.useState('light')

      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button">Open dropdown</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel inset>编辑</DropdownMenuLabel>
              <DropdownMenuItem>复制</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={gridVisible}
                onCheckedChange={(checked) => setGridVisible(Boolean(checked))}
                onSelect={(event) => event.preventDefault()}
              >
                显示网格
              </DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value={alignment} onValueChange={setAlignment}>
                <DropdownMenuRadioItem value="left" onSelect={(event) => event.preventDefault()}>
                  左对齐
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right" onSelect={(event) => event.preventDefault()}>
                  右对齐
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>更多</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>嵌套动作</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuContent>
          </DropdownMenu>

          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div>右键目标</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuLabel inset>上下文</ContextMenuLabel>
              <ContextMenuItem>重命名</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem
                checked={contextPinned}
                onCheckedChange={(checked) => setContextPinned(Boolean(checked))}
                onSelect={(event) => event.preventDefault()}
              >
                固定
              </ContextMenuCheckboxItem>
              <ContextMenuRadioGroup value={contextTone} onValueChange={setContextTone}>
                <ContextMenuRadioItem value="light" onSelect={(event) => event.preventDefault()}>
                  浅色
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="dark" onSelect={(event) => event.preventDefault()}>
                  深色
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSub>
                <ContextMenuSubTrigger>高级</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem>嵌套项</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )
    }

    render(<MenuDemo />)

    await user.click(screen.getByRole('button', { name: 'Open dropdown' }))
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitemcheckbox', { name: '显示网格' }))
    expect(screen.getByRole('menuitemcheckbox', { name: '显示网格' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('menuitemradio', { name: '右对齐' }))
    expect(screen.getByRole('menuitemradio', { name: '右对齐' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.contextMenu(screen.getByText('右键目标'))
    await user.click(screen.getByRole('menuitemcheckbox', { name: '固定' }))
    expect(screen.getByRole('menuitemcheckbox', { name: '固定' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('menuitemradio', { name: '深色' }))
    expect(screen.getByRole('menuitemradio', { name: '深色' })).toHaveAttribute('aria-checked', 'true')
  })

  it('opens menubar, navigation menu, collapsible, accordion, and command dialog', async () => {
    const user = userEvent.setup()

    function MenuDemo() {
      const [menuAutosave, setMenuAutosave] = React.useState(false)
      const [menuTone, setMenuTone] = React.useState('light')

      return (
        <div>
          <Menubar defaultValue="file">
            <MenubarMenu value="file">
              <MenubarTrigger>文件</MenubarTrigger>
              <MenubarContent>
                <MenubarLabel inset>项目</MenubarLabel>
                <MenubarItem>新建</MenubarItem>
                <MenubarSeparator />
                <MenubarCheckboxItem
                  checked={menuAutosave}
                  onCheckedChange={(checked) => setMenuAutosave(Boolean(checked))}
                  onSelect={(event) => event.preventDefault()}
                >
                  自动保存
                </MenubarCheckboxItem>
                <MenubarRadioGroup value={menuTone} onValueChange={setMenuTone}>
                  <MenubarRadioItem value="light" onSelect={(event) => event.preventDefault()}>
                    浅色
                  </MenubarRadioItem>
                  <MenubarRadioItem value="dark" onSelect={(event) => event.preventDefault()}>
                    深色
                  </MenubarRadioItem>
                </MenubarRadioGroup>
                <MenubarSub>
                  <MenubarSubTrigger>分享</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>复制链接</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          <NavigationMenu defaultValue="courses">
            <NavigationMenuList>
              <NavigationMenuItem value="courses">
                <NavigationMenuTrigger>课程</NavigationMenuTrigger>
                <NavigationMenuContent forceMount>
                  <NavigationMenuLink asChild>
                    <a href="/archive">训练档案</a>
                  </NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <button type="button">Toggle collapsible</button>
            </CollapsibleTrigger>
            <CollapsibleContent>可折叠内容</CollapsibleContent>
          </Collapsible>

          <Accordion type="single" collapsible>
            <AccordionItem value="analysis">
              <AccordionTrigger>分析详情</AccordionTrigger>
              <AccordionContent>展开后的内容</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    }

    render(<MenuDemo />)

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitemcheckbox', { name: '自动保存' }))
    expect(screen.getByRole('menuitemcheckbox', { name: '自动保存' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: '深色' }))
    expect(screen.getByRole('menuitemradio', { name: '深色' })).toHaveAttribute('aria-checked', 'true')
    expect(await screen.findByText('训练档案')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Toggle collapsible' }))
    expect(screen.getByText('可折叠内容')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '分析详情' }))
    expect(screen.getByText('展开后的内容')).toBeInTheDocument()
  })

  it('renders the command dialog content', () => {
    render(
      <CommandDialog open title="命令面板" description="搜索命令" showCloseButton={false}>
        <CommandInput placeholder="输入命令" />
        <CommandList />
      </CommandDialog>
    )

    expect(screen.getByRole('dialog', { name: '命令面板' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('输入命令')).toBeInTheDocument()
  })
})
