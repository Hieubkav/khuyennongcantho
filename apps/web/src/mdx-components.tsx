import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import * as React from "react";

// Fallbacks for MDX components that may not be provided by the theme
function Steps({ children }: { children?: React.ReactNode }) {
	return <ol className="space-y-4 list-decimal pl-6">{children}</ol>;
}

function Step({ title, children }: { title?: string; children?: React.ReactNode }) {
	return (
		<li>
			{title ? <div className="font-medium mb-1">{title}</div> : null}
			<div className="text-muted-foreground">{children}</div>
		</li>
	);
}

// Very small, non-interactive fallbacks to prevent MDX crash when
// `Tabs` / `Tab` are referenced but not provided by the theme.
// They simply render content with light styling.
function Tabs({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-3 rounded-md border p-3">{children}</div>;
}

function Tab({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      {title ? <div className="mb-2 text-sm font-medium">{title}</div> : null}
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		// Provide simple fallbacks so MDX doesn't crash if theme lacks them
		Steps,
		Step,
		Tabs,
		Tab,
		...components,
	};
}

