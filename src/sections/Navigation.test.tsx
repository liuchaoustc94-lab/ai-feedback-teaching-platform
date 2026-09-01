import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from './Navigation'

describe('Navigation', () => {
  it('renders desktop navigation links and the platform entry', () => {
    render(<Navigation />)

    expect(screen.getByText('Motor Control Lab')).toBeInTheDocument()
    expect(screen.getAllByText('信息加工')).toHaveLength(1)
    expect(screen.getAllByText('感觉系统')).toHaveLength(1)
    expect(screen.getByRole('link', { name: '进入平台' })).toHaveAttribute('href', '/platform.html')
  })

  it('opens the mobile menu and scrolls to a selected section', async () => {
    const user = userEvent.setup()
    const target = document.createElement('section')
    target.id = 'attention'
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    render(<Navigation />)

    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))

    expect(screen.getAllByText('注意分配')).toHaveLength(2)

    await user.click(screen.getAllByText('注意分配')[1])

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    expect(screen.getAllByText('注意分配')).toHaveLength(1)

    target.remove()
  })

  it('opens the signed-in user menu with admin actions and account switching', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()

    render(
      <Navigation
        visibleModules={[]}
        isAdmin
        userLabel="Everest Administrator"
        userName="admin"
        onLogout={onLogout}
      />,
    )

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))

    expect(screen.getAllByText('Everest Administrator')).toHaveLength(2)
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('后端正常')).toBeInTheDocument()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '用户管理' })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('menuitem', { name: '修改密码' })).toHaveAttribute('href', '/change-password')

    await user.click(screen.getByRole('menuitem', { name: '退出登录并切换用户' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('keeps password and switching actions but hides user management for students', async () => {
    const user = userEvent.setup()

    render(
      <Navigation
        visibleModules={[]}
        userLabel="学生用户"
        onLogout={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '打开用户菜单' }))

    expect(screen.queryByRole('menuitem', { name: '用户管理' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '修改密码' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '退出登录并切换用户' })).toBeInTheDocument()
  })
})
