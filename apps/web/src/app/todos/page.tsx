"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TodosPage() {
  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Todo Demo Unavailable</CardTitle>
          <CardDescription>
            The backend module for todos is not configured. Remove this page or
            add a Convex module "todos" with queries and mutations, then
            regenerate Convex types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This route is a placeholder to allow the app to build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
