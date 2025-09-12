"use client";
import { createContext, useContext, useEffect, useState } from 'react'
import { getCookie, setCookie } from '@/lib/cookies'

export type Collapsible = 'offcanvas' | 'icon' | 'none'
export type Variant = 'inset' | 'sidebar' | 'floating'

const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'layout_collapsible'
const LAYOUT_VARIANT_COOKIE_NAME = 'layout_variant'
const LAYOUT_SIDEBAR_HIDDEN_COOKIE_NAME = 'layout_sidebar_hidden'
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const DEFAULT_VARIANT: Variant = 'inset'
const DEFAULT_COLLAPSIBLE: Collapsible = 'offcanvas'
const DEFAULT_SIDEBAR_HIDDEN = false

type LayoutContextType = {
  resetLayout: () => void
  defaultCollapsible: Collapsible
  collapsible: Collapsible
  setCollapsible: (collapsible: Collapsible) => void
  defaultVariant: Variant
  variant: Variant
  setVariant: (variant: Variant) => void
  sidebarHidden: boolean
  setSidebarHidden: (hidden: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsible, _setCollapsible] = useState<Collapsible>(DEFAULT_COLLAPSIBLE)

  const [variant, _setVariant] = useState<Variant>(DEFAULT_VARIANT)

  const [sidebarHidden, _setSidebarHidden] = useState<boolean>(DEFAULT_SIDEBAR_HIDDEN)

  useEffect(() => {
    const savedCollapsible = getCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME)
    if (savedCollapsible) _setCollapsible(savedCollapsible as Collapsible)
    const savedVariant = getCookie(LAYOUT_VARIANT_COOKIE_NAME)
    if (savedVariant) _setVariant(savedVariant as Variant)
    const savedHidden = getCookie(LAYOUT_SIDEBAR_HIDDEN_COOKIE_NAME)
    if (savedHidden === 'true' || savedHidden === 'false') _setSidebarHidden(savedHidden === 'true')
  }, [])

  const setCollapsible = (newCollapsible: Collapsible) => {
    _setCollapsible(newCollapsible)
    setCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME, newCollapsible, LAYOUT_COOKIE_MAX_AGE)
  }

  const setVariant = (newVariant: Variant) => {
    _setVariant(newVariant)
    setCookie(LAYOUT_VARIANT_COOKIE_NAME, newVariant, LAYOUT_COOKIE_MAX_AGE)
  }

  const setSidebarHidden = (hidden: boolean) => {
    _setSidebarHidden(hidden)
    setCookie(LAYOUT_SIDEBAR_HIDDEN_COOKIE_NAME, hidden ? 'true' : 'false', LAYOUT_COOKIE_MAX_AGE)
  }

  const resetLayout = () => {
    setCollapsible(DEFAULT_COLLAPSIBLE)
    setVariant(DEFAULT_VARIANT)
    setSidebarHidden(DEFAULT_SIDEBAR_HIDDEN)
  }

  const contextValue: LayoutContextType = {
    resetLayout,
    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    collapsible,
    setCollapsible,
    defaultVariant: DEFAULT_VARIANT,
    variant,
    setVariant,
    sidebarHidden,
    setSidebarHidden,
  }

  return <LayoutContext value={contextValue}>{children}</LayoutContext>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within a LayoutProvider')
  return context
}
