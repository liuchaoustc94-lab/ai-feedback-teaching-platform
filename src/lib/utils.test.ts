import { cn } from './utils'

describe('cn', () => {
  it('combines conditional class names and resolves Tailwind conflicts', () => {
    const isHidden = false

    expect(cn('px-2 text-sm', isHidden && 'hidden', ['px-4', 'font-medium'])).toBe('text-sm px-4 font-medium')
  })
})
