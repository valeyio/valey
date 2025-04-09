import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Onboarding } from '@/components/Onboarding'

type OnboardingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView?: 'signup' | 'login'
}

export function OnboardingModal({
  open,
  onOpenChange,
  initialView = 'signup',
}: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl border-none bg-transparent p-0 shadow-none"
        hideCloseButton
      >
        <Onboarding
          onClose={() => onOpenChange(false)}
          initialView={initialView}
        />
      </DialogContent>
    </Dialog>
  )
}
