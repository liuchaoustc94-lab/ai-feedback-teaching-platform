import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AspectRatio } from './aspect-ratio'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'
import { ScrollArea } from './scroll-area'
import { Slider } from './slider'
import { Switch } from './switch'
import { Toggle } from './toggle'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
} from './input-group'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp'

beforeAll(() => {
  if (!document.elementFromPoint) {
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => null,
    })
  }
})

describe('additional UI primitives', () => {
  it('renders structural wrappers and navigation affordances', () => {
    const { container } = render(
      <div>
        <AspectRatio ratio={16 / 9}>
          <img src="/demo.png" alt="示例图" />
        </AspectRatio>

        <ButtonGroup orientation="vertical">
          <ButtonGroupText asChild>
            <a href="/platform.html">进入平台</a>
          </ButtonGroupText>
          <button type="button">保存</button>
          <ButtonGroupSeparator />
          <button type="button">分享</button>
        </ButtonGroup>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="/">首页</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>当前页</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    )

    expect(screen.getByAltText('示例图').closest('[data-slot="aspect-ratio"]')).toHaveAttribute(
      'data-slot',
      'aspect-ratio'
    )
    expect(screen.getByRole('group')).toHaveAttribute('data-slot', 'button-group')
    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByRole('link', { name: '进入平台' })).toHaveAttribute('href', '/platform.html')
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toHaveAttribute(
      'data-slot',
      'breadcrumb'
    )
    expect(screen.getByRole('link', { name: '首页' })).toHaveAttribute('data-slot', 'breadcrumb-link')
    expect(screen.getByRole('link', { name: '当前页' })).toHaveAttribute('aria-current', 'page')

    expect(container.querySelector('[data-slot="breadcrumb-separator"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="breadcrumb-ellipsis"]')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('renders item, field, empty, and pagination primitives', () => {
    const { container } = render(
      <div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">图标</EmptyMedia>
            <EmptyTitle>暂无数据</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>请先记录一次训练</EmptyDescription>
          </EmptyContent>
        </Empty>

        <FieldSet>
          <FieldLegend variant="label">个人信息</FieldLegend>
          <FieldGroup>
            <Field orientation="horizontal" data-testid="field-row">
              <FieldTitle>学生姓名</FieldTitle>
              <FieldContent>
                <FieldDescription>填写真实姓名</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
          <FieldSeparator>或者</FieldSeparator>
          <FieldError errors={[{ message: '姓名必填' }, { message: '姓名必填' }, { message: '学号必填' }]} />
        </FieldSet>

        <ItemGroup>
          <Item asChild variant="outline">
            <a href="/records" aria-label="训练记录">
              <ItemHeader>
                <ItemTitle>训练记录</ItemTitle>
                <ItemActions>更多</ItemActions>
              </ItemHeader>
              <ItemContent>
                <ItemDescription>记录一条本地训练结果</ItemDescription>
              </ItemContent>
              <ItemFooter>
                <ItemMedia variant="icon">R</ItemMedia>
              </ItemFooter>
            </a>
          </Item>
          <ItemSeparator />
        </ItemGroup>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="/prev" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/1" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="/next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )

    expect(screen.getByText('图标')).toHaveAttribute('data-slot', 'empty-icon')
    expect(screen.getByText('暂无数据')).toHaveAttribute('data-slot', 'empty-title')
    expect(screen.getByText('请先记录一次训练')).toHaveAttribute('data-slot', 'empty-description')

    expect(screen.getByRole('group', { name: '个人信息' })).toHaveAttribute('data-slot', 'field-set')
    expect(screen.getByTestId('field-row')).toHaveAttribute('data-slot', 'field')
    expect(screen.getByText('学生姓名')).toHaveAttribute('data-slot', 'field-label')
    expect(screen.getByText('填写真实姓名')).toHaveAttribute('data-slot', 'field-description')
    expect(screen.getByText('或者')).toHaveAttribute('data-slot', 'field-separator-content')
    expect(screen.getByRole('alert')).toHaveAttribute('data-slot', 'field-error')
    expect(screen.getByRole('alert')).toHaveTextContent('姓名必填')
    expect(screen.getByRole('alert')).toHaveTextContent('学号必填')

    expect(screen.getByRole('link', { name: '训练记录' })).toHaveAttribute('data-slot', 'item')
    expect(screen.getByText('训练记录')).toHaveAttribute('data-slot', 'item-title')
    expect(screen.getByText('更多')).toHaveAttribute('data-slot', 'item-actions')
    expect(screen.getByText('记录一条本地训练结果')).toHaveAttribute('data-slot', 'item-description')
    expect(screen.getByText('R')).toHaveAttribute('data-slot', 'item-media')
    expect(container.querySelector('[data-slot="item-group"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="item-separator"]')).toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: 'pagination' })).toHaveAttribute('data-slot', 'pagination')
    expect(screen.getByRole('link', { name: 'Go to previous page' })).toHaveAttribute('href', '/prev')
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Go to next page' })).toHaveAttribute('href', '/next')
    expect(container.querySelector('[data-slot="pagination-content"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="pagination-ellipsis"]')).toBeInTheDocument()
  })

  it('wires interactive controls and value-based variants', async () => {
    const user = userEvent.setup()
    const onRadioChange = vi.fn()
    const onToggleGroupChange = vi.fn()
    const onOtpChange = vi.fn()

    const { container } = render(
      <div>
        <RadioGroup defaultValue="left" onValueChange={onRadioChange}>
          <RadioGroupItem value="left" aria-label="左对齐" />
          <RadioGroupItem value="right" aria-label="右对齐" />
        </RadioGroup>

        <Switch aria-label="摄像头" />

        <Toggle aria-label="加粗">B</Toggle>

        <ToggleGroup type="single" defaultValue="one" onValueChange={onToggleGroupChange} spacing={4} orientation="vertical">
          <ToggleGroupItem value="one">一</ToggleGroupItem>
          <ToggleGroupItem value="two">二</ToggleGroupItem>
        </ToggleGroup>

        <InputGroup>
          <InputGroupAddon>前缀</InputGroupAddon>
          <InputGroupInput aria-label="搜索框" />
          <InputGroupButton aria-label="清空">清空</InputGroupButton>
        </InputGroup>

        <InputGroup>
          <InputGroupAddon align="block-start">说明</InputGroupAddon>
          <InputGroupTextarea aria-label="备注" />
          <InputGroupText>kg</InputGroupText>
        </InputGroup>

        <InputOTP maxLength={4} value="12" onChange={onOtpChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSeparator />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>

        <Slider defaultValue={[25, 75]} aria-label="范围" />
        <Slider value={[50]} onValueChange={vi.fn()} aria-label="单值" />
      </div>
    )

    await user.click(screen.getByRole('radio', { name: '右对齐' }))
    expect(onRadioChange).toHaveBeenCalledWith('right')
    expect(screen.getByRole('radio', { name: '右对齐' })).toBeChecked()

    await user.click(screen.getByRole('switch', { name: '摄像头' }))
    expect(screen.getByRole('switch', { name: '摄像头' })).toBeChecked()

    await user.click(screen.getByRole('button', { name: '加粗' }))
    expect(screen.getByRole('button', { name: '加粗' })).toHaveAttribute('data-state', 'on')

    const toggleGroup = container.querySelector('[data-slot="toggle-group"]')
    expect(toggleGroup).toHaveAttribute('data-orientation', 'vertical')
    expect(toggleGroup).toHaveAttribute('data-spacing', '4')

    const secondToggle = screen.getByRole('radio', { name: '二' })
    await user.click(secondToggle)
    expect(onToggleGroupChange).toHaveBeenCalledWith('two')
    expect(secondToggle).toHaveAttribute('data-state', 'on')

    await user.click(screen.getByText('前缀'))
    const searchInput = screen.getByRole('textbox', { name: '搜索框' })
    expect(searchInput).toHaveFocus()
    await user.type(searchInput, '运动')
    expect(searchInput).toHaveValue('运动')
    expect(screen.getByRole('textbox', { name: '备注' })).toHaveAttribute('data-slot', 'input-group-control')

    const otpInput = screen.getAllByRole('textbox').find((element) => element.getAttribute('data-slot') === 'input-otp')
    expect(otpInput).toBeDefined()
    await user.click(otpInput as HTMLElement)
    await user.type(otpInput as HTMLElement, '34')
    expect(onOtpChange).toHaveBeenCalled()
    expect(screen.getByText('1')).toHaveAttribute('data-slot', 'input-otp-slot')
    expect(screen.getByText('2')).toHaveAttribute('data-slot', 'input-otp-slot')
    expect(screen.getByRole('separator')).toHaveAttribute('data-slot', 'input-otp-separator')

    expect(screen.getAllByRole('slider')).toHaveLength(3)
  })

  it('renders scroll and resizable layouts', () => {
    const { container } = render(
      <div>
        <ScrollArea className="h-32" type="always">
          <div className="h-64 w-64">内容</div>
        </ScrollArea>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>左</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>右</ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )

    expect(screen.getByText('内容')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]')).toBeInTheDocument()

    expect(screen.getByText('左').closest('[data-slot="resizable-panel"]')).toHaveAttribute(
      'data-slot',
      'resizable-panel'
    )
    expect(screen.getByText('右').closest('[data-slot="resizable-panel"]')).toHaveAttribute(
      'data-slot',
      'resizable-panel'
    )
    expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="resizable-handle"]')).toBeInTheDocument()
  })
})
