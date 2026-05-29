import * as React from "react"

import { cn } from "@/lib/utils"

function roundToTwoDecimals(
  value: React.ComponentProps<"input">["value"]
): React.ComponentProps<"input">["value"] {
  if (value === undefined || value === null || value === "") {
    return value
  }

  const num =
    typeof value === "number" ? value : Number.parseFloat(String(value))

  if (Number.isNaN(num)) {
    return value
  }

  return Number(num.toFixed(2))
}

function isZeroValue(
  value: React.ComponentProps<"input">["value"]
): boolean {
  if (value === undefined || value === null || value === "") {
    return false
  }

  const num =
    typeof value === "number" ? value : Number.parseFloat(String(value))

  return !Number.isNaN(num) && num === 0
}

function formatNumberDraft(
  value: React.ComponentProps<"input">["value"]
): string {
  if (value === undefined || value === null || value === "") {
    return ""
  }

  const rounded = roundToTwoDecimals(value)
  if (rounded === "" || rounded === undefined || rounded === null) {
    return ""
  }

  return String(rounded)
}

function isIncompleteNumberDraft(draft: string): boolean {
  return (
    draft === "" ||
    draft === "-" ||
    draft === "." ||
    draft === "-." ||
    draft.endsWith(".")
  )
}

function Input({
  className,
  type,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  ...props
}: React.ComponentProps<"input">) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isControlled = value !== undefined
  const isNumberInput = type === "number"
  const [isNumberEditing, setIsNumberEditing] = React.useState(false)
  const [numberDraft, setNumberDraft] = React.useState("")

  const displayValue =
    type === "number" && value != null && value !== ""
      ? roundToTwoDecimals(value)
      : value
  const displayDefaultValue =
    type === "number" && defaultValue != null && defaultValue !== ""
      ? roundToTwoDecimals(defaultValue)
      : defaultValue

  const shownValue = React.useMemo(() => {
    if (isNumberInput && isNumberEditing) {
      return numberDraft
    }

    if (type === "number" && value != null && value !== "") {
      return roundToTwoDecimals(value)
    }

    return value
  }, [isNumberInput, isNumberEditing, numberDraft, type, value])

  const emitNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    parsed: number
  ) => {
    onChange?.({
      ...event,
      target: {
        ...event.target,
        value: String(parsed),
        valueAsNumber: parsed,
      },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumberInput) {
      const initial = isControlled ? displayValue : displayDefaultValue
      setNumberDraft(
        isZeroValue(initial) ? "" : formatNumberDraft(initial)
      )
      setIsNumberEditing(true)

      if (isZeroValue(initial) && !isControlled && inputRef.current) {
        inputRef.current.value = ""
      }
    }
    onFocus?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumberInput && isNumberEditing) {
      const next = e.target.value
      setNumberDraft(next)

      if (isIncompleteNumberDraft(next)) {
        return
      }

      const parsed = Number.parseFloat(next)
      if (Number.isFinite(parsed)) {
        emitNumberChange(e, parsed)
      }
      return
    }

    onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumberInput && isNumberEditing) {
      const parsed = Number.parseFloat(numberDraft)
      const committed =
        !isIncompleteNumberDraft(numberDraft) && Number.isFinite(parsed)

      if (committed && isControlled && onChange) {
        const current =
          typeof value === "number"
            ? value
            : Number.parseFloat(String(value ?? ""))

        if (!Number.isFinite(current) || current !== parsed) {
          emitNumberChange(
            e as unknown as React.ChangeEvent<HTMLInputElement>,
            parsed
          )
        }
      }

      if (!committed && !isControlled && inputRef.current) {
        const fallback = displayDefaultValue ?? ""
        inputRef.current.value =
          fallback === "" ? "" : String(roundToTwoDecimals(fallback))
      }

      if (committed && !isControlled && inputRef.current) {
        inputRef.current.value = String(parsed)
      }

      setIsNumberEditing(false)
      setNumberDraft("")
      onBlur?.(e)
      return
    }

    onBlur?.(e)
  }

  const usesDraftValue = isNumberInput && isNumberEditing
  const passesValueProp = isControlled || usesDraftValue

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
      {...(passesValueProp ? { value: shownValue ?? "" } : {})}
      {...(!passesValueProp && defaultValue !== undefined
        ? { defaultValue: displayDefaultValue }
        : {})}
    />
  )
}

export { Input }
