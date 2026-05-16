"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { User, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { updateProfile, sendPasswordReset } from "./actions"

interface Props {
  email: string
  fullName: string
  role: string
}

export function ProfileClient({ email, fullName, role }: Props) {
  const [name, setName] = useState(fullName)
  const [isPending, startTransition] = useTransition()
  const [resetSent, setResetSent] = useState(false)

  function handleSave() {
    if (!name.trim()) { toast.error("Name cannot be empty"); return }
    startTransition(async () => {
      const res = await updateProfile({ full_name: name.trim() })
      if (res?.error) { toast.error(res.error); return }
      toast.success("Profile updated")
    })
  }

  function handlePasswordReset() {
    startTransition(async () => {
      const res = await sendPasswordReset()
      if (res?.error) { toast.error(res.error); return }
      setResetSent(true)
      toast.success("Password reset email sent")
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{email}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Display name</Label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>Role</Label>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
              {role}
            </Badge>
          </div>
          <Button disabled={isPending || name === fullName} onClick={handleSave}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            We&apos;ll send a reset link to <span className="font-medium text-foreground">{email}</span>.
          </p>
          <Button
            variant="outline"
            disabled={isPending || resetSent}
            onClick={handlePasswordReset}
          >
            {resetSent ? "Email sent" : "Send reset email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
