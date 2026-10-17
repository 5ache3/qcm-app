"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { approveOAuthAuthorization, denyOAuthAuthorization } from "./actions"

interface Props {
  authorizationId: string
  canApprove: boolean
}

export function ConsentButtons({ authorizationId, canApprove }: Props) {
  const [isPending, startTransition] = useTransition()

  function decide(approve: boolean) {
    startTransition(async () => {
      const res = approve
        ? await approveOAuthAuthorization(authorizationId)
        : await denyOAuthAuthorization(authorizationId)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" disabled={isPending} onClick={() => decide(false)}>
        Refuser
      </Button>
      {canApprove && (
        <Button className="flex-1" disabled={isPending} onClick={() => decide(true)}>
          Autoriser
        </Button>
      )}
    </div>
  )
}
