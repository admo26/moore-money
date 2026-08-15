"use client";

/**
 * HeroUI v3 modal, re-exported under the app's old Dialog names so a future
 * migration of components/ui/dialog.tsx's call sites (mcp-token-dialog.tsx
 * etc.) is mostly a rename. HeroUI calls this "Modal", not "Dialog", and its
 * structure has two pieces the old Base UI dialog didn't need spelled out
 * (DialogContainer wraps backdrop+content; DialogCloseTrigger is explicit
 * rather than DialogClose closing whatever's nearest). There's no
 * DialogDescription here — HeroUI's Modal has no matching sub-component
 * (just Heading + Body) and no current call site needs one; add it if one
 * does. ModalRoot's `state` prop is optional — it also accepts the standard
 * react-aria DialogTrigger `isOpen`/`onOpenChange`/`defaultOpen` props, which
 * is the closest match to the old Dialog.Root's `open`/`onOpenChange`.
 */
import {
  ModalRoot as Dialog,
  ModalTrigger as DialogTrigger,
  ModalBackdrop as DialogBackdrop,
  ModalContainer as DialogContainer,
  ModalDialog as DialogContent,
  ModalHeader as DialogHeader,
  ModalHeading as DialogTitle,
  ModalBody as DialogBody,
  ModalFooter as DialogFooter,
  ModalCloseTrigger as DialogCloseTrigger,
} from "@heroui/react/modal";

export {
  Dialog,
  DialogTrigger,
  DialogBackdrop,
  DialogContainer,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
};
