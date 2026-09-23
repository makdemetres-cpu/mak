import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

const listeners = new Set<() => void>()

export function navigate(to: string) {
  if (to === window.location.pathname + window.location.search) return
  window.history.pushState(null, '', to)
  window.scrollTo(0, 0)
  listeners.forEach((fn) => fn())
}

window.addEventListener('popstate', () => listeners.forEach((fn) => fn()))

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])
  return path
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handle(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(href)
  }
  return <a href={href} onClick={handle} {...rest} />
}
