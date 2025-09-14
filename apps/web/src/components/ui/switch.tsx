"use client";

import * as React from "react";

type Props = {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Switch({ id, checked, onCheckedChange, className }: Props) {
  return (
    <input
      id={id}
      type="checkbox"
      className={className}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}

