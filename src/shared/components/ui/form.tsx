"use client"

import type * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form"
import {
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { Label } from "@/shared/components/ui/label"
import { cn } from "@/shared/lib/utils"

const Form = FormProvider

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = React.forwardRef<
  HTMLDivElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ControllerProps<any> & React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, _ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, name, render } = props as ControllerProps<any> & React.HTMLAttributes<HTMLDivElement>
  return (
    <FormFieldContext.Provider value={{ name: name as never }}>
      <Controller
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        control={control!}
        name={name}
        render={render as never}
      />
    </FormFieldContext.Provider>
  )
})
FormField.displayName = "FormField"

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  return {
    ...fieldState,
    name: fieldContext.name,
  }
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
   
  <Label
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ComponentRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error } = useFormField()
  const fieldContext = React.useContext(FormFieldContext)

  return (
    <Slot
      ref={ref}
       
      aria-describedby={
        error == null ? `${fieldContext.name}-description` : `${fieldContext.name}-error`
      }
       
      aria-invalid={error != null}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { error } = useFormField()
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const body = error ? String(error.message) : null

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormContext as useForm,
  FormProvider,
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
