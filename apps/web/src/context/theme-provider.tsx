"use client";
import { createContext, useContext, useMemo } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

type ThemeProviderState = {
  defaultTheme: Theme
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const initialState: ThemeProviderState = {
  defaultTheme: 'system',
  resolvedTheme: 'light',
  theme: 'system',
  setTheme: () => {},
  resetTheme: () => {},
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme()

  const value = useMemo<ThemeProviderState>(() => {
    const currentResolved = (resolvedTheme ?? (systemTheme === 'dark' ? 'dark' : 'light')) as ResolvedTheme
    return {
      defaultTheme: 'system',
      resolvedTheme: currentResolved,
      theme: (theme as Theme) ?? 'system',
      setTheme: (t: Theme) => setTheme(t),
      resetTheme: () => setTheme('system'),
    }
  }, [theme, setTheme, systemTheme, resolvedTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

