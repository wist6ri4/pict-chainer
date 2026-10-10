import type { ButtonHTMLAttributes } from 'react'
import { se } from '../lib/audio'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'yellow' | 'pink' | 'cyan' | 'white' | 'green'
  size?: 'lg' | 'md' | 'sm'
  /** タップ音を鳴らさない（別の音を鳴らす場合） */
  silent?: boolean
}

export function Button({
  color = 'yellow',
  size = 'md',
  silent,
  className = '',
  onClick,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={`btn btn-${color} btn-${size} ${className}`}
      onClick={(e) => {
        if (!silent) se.tap()
        onClick?.(e)
      }}
      {...rest}
    />
  )
}
