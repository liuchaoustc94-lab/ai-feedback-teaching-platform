import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Button, buttonVariants } from './button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Kbd, KbdGroup } from './kbd'
import { Label } from './label'
import { Progress } from './progress'
import { Separator } from './separator'
import { Skeleton } from './skeleton'
import { Spinner } from './spinner'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Textarea } from './textarea'

describe('core UI components', () => {
  it('renders button variants and supports asChild links', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <div>
        <Button variant="secondary" size="sm" onClick={onClick}>
          Save
        </Button>
        <Button asChild variant="link">
          <a href="/platform.html">Platform</a>
        </Button>
      </div>
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('data-variant', 'secondary')
    expect(screen.getByRole('link', { name: 'Platform' })).toHaveAttribute('href', '/platform.html')
    expect(buttonVariants({ variant: 'destructive', size: 'lg' })).toContain('bg-destructive')
  })

  it('renders badge, alert, card, keyboard, skeleton, and spinner primitives', () => {
    render(
      <div>
        <Badge variant="outline">Beta</Badge>
        <Alert variant="destructive">
          <AlertTitle>出错啦</AlertTitle>
          <AlertDescription>请检查输入</AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>档案概览</CardTitle>
            <CardDescription>本地记录</CardDescription>
            <CardAction>更多</CardAction>
          </CardHeader>
          <CardContent>3 条记录</CardContent>
          <CardFooter>已同步</CardFooter>
        </Card>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Skeleton data-testid="loading-skeleton" />
        <Spinner className="text-blue-500" />
      </div>
    )

    expect(screen.getByText('Beta')).toHaveAttribute('data-slot', 'badge')
    expect(screen.getByRole('alert')).toHaveTextContent('请检查输入')
    expect(screen.getByText('档案概览')).toHaveAttribute('data-slot', 'card-title')
    expect(screen.getByText('⌘')).toHaveAttribute('data-slot', 'kbd')
    expect(screen.getByTestId('loading-skeleton')).toHaveAttribute('data-slot', 'skeleton')
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('wires label, input, textarea, and checkbox controls', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Label htmlFor="name">姓名</Label>
        <Input id="name" placeholder="输入姓名" />
        <Textarea aria-label="备注" />
        <Checkbox id="agree" aria-label="同意" />
      </div>
    )

    await user.type(screen.getByLabelText('姓名'), 'Alice')
    await user.type(screen.getByLabelText('备注'), '课堂记录')
    await user.click(screen.getByRole('checkbox', { name: '同意' }))

    expect(screen.getByLabelText('姓名')).toHaveValue('Alice')
    expect(screen.getByLabelText('备注')).toHaveValue('课堂记录')
    expect(screen.getByRole('checkbox', { name: '同意' })).toBeChecked()
  })

  it('renders layout primitives with semantic roles and attributes', () => {
    render(
      <div>
        <Avatar data-testid="student-avatar">
          <AvatarImage src="/avatar.png" alt="学生头像" />
          <AvatarFallback>TJ</AvatarFallback>
        </Avatar>
        <Progress value={42} aria-label="完成度" />
        <Separator orientation="vertical" decorative={false} />
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">历史</TabsTrigger>
            <TabsTrigger value="summary">概览</TabsTrigger>
          </TabsList>
          <TabsContent value="history">历史记录</TabsContent>
          <TabsContent value="summary">概览信息</TabsContent>
        </Tabs>
        <Table>
          <TableCaption>训练记录</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>项目</TableHead>
              <TableHead>质量</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>F2.1</TableCell>
              <TableCell>良好</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>总计</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )

    expect(screen.getByTestId('student-avatar')).toHaveAttribute('data-slot', 'avatar')
    expect(screen.getByText('TJ')).toHaveAttribute('data-slot', 'avatar-fallback')
    expect(screen.getByRole('progressbar', { name: '完成度' })).toHaveAttribute('data-slot', 'progress')
    expect(screen.getByRole('separator')).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByRole('tab', { name: '历史' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('历史记录')
    expect(screen.getByRole('table')).toHaveTextContent('F2.1')
    expect(screen.getByText('训练记录')).toHaveAttribute('data-slot', 'table-caption')
  })
})
