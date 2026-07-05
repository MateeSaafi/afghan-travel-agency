import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  category: z
    .string()
    .min(1, "Category is required")
    .refine(
      (val) => ["visa", "ticket", "scholarship", "asylum", "form"].includes(val),
      "Please select a valid category"
    ),
  headline: z
    .string()
    .min(1, "Headline is required")
    .min(5, "Headline must be at least 5 characters")
    .max(200, "Headline must be less than 200 characters"),
  processTime: z
    .string()
    .min(1, "Process time is required")
    .max(50, "Process time must be less than 50 characters"),
  price: z
    .number()
    .min(0, "Price must be a positive number")
    .max(1000000, "Price is too high"),
  requiredDocs: z
    .string()
    .min(1, "Required documents are required")
    .max(1000, "Required documents list is too long"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const CATEGORIES = [
  { value: "visa", label: "Visa" },
  { value: "ticket", label: "Ticket" },
  { value: "scholarship", label: "Scholarship" },
  { value: "asylum", label: "Asylum" },
  { value: "form", label: "Online Form" },
] as const;
