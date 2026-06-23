"use client";

import { Inbox } from "lucide-react";
import { Card } from "@/components/Card";

export function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/4 rounded-md bg-gray-200" />
            <div className="h-6 w-1/3 rounded-md bg-gray-200" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ErrorState({
  message = "Nao foi possivel carregar os dados agora.",
}: {
  message?: string;
}) {
  return (
    <Card className="border-red-200 bg-red-50 text-red-700">{message}</Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Inbox className="text-uau-gray" size={24} />
      </div>
      <p className="font-semibold text-uau-black">{title}</p>
      <p className="mt-1 text-sm text-uau-gray">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
