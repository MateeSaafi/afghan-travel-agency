"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { uploadFile } from "../../../lib/uploadFile";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { productSchema, ProductFormData, CATEGORIES } from "../../../lib/validations/product";
import { z } from "zod";

type FieldErrors = Partial<Record<keyof ProductFormData | "image", string>>;

export default function NewProductPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    headline: "",
    processTime: "",
    price: 0,
    requiredDocs: "",
    description: "",
  });

  const validateField = (field: keyof ProductFormData, value: unknown) => {
    try {
      const fieldSchema = productSchema.shape[field];
      fieldSchema.parse(value);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.issues[0].message }));
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      validateField(name as keyof ProductFormData, newValue);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;
    validateField(name as keyof ProductFormData, fieldValue);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "Please select a valid image file" }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image must be less than 5MB" }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched({ ...allTouched, image: true });

    // Validate all fields
    const result = productSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof ProductFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setSubmitting(false);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Validate image
    if (!imageFile) {
      setErrors((prev) => ({ ...prev, image: "Please select an image" }));
      setSubmitting(false);
      toast.error("Please select an image for the product");
      return;
    }

    try {
      // Upload image to local storage
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      const uploaded = await uploadFile(imageFile, "image", idToken);
      const imageUrl = uploaded.url!;

      // Parse required docs
      const requiredDocsArray = formData.requiredDocs
        .split(/[,\u060C\u060D]/)
        .map((doc) => doc.trim())
        .filter((doc) => doc.length > 0);

      // Add to Firestore
      await addDoc(collection(db, "items"), {
        name: formData.name.trim(),
        category: formData.category,
        headline: formData.headline.trim(),
        processTime: formData.processTime.trim(),
        price: formData.price,
        image: imageUrl,
        requiredDocs: requiredDocsArray,
        description: formData.description?.trim() || "",
        createdAt: Date.now(),
      });

      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const getInputClassName = (field: keyof ProductFormData | "image") => {
    const baseClass =
      "w-full bg-zinc-950 border rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors";
    const hasError = touched[field] && errors[field];

    return `${baseClass} ${
      hasError
        ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
        : "border-zinc-800 focus:ring-zinc-700 focus:border-transparent"
    }`;
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-zinc-100">Add New Product</h1>
          <p className="text-sm text-zinc-400 mt-1">Create a new product listing</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getInputClassName("name")} h-10`}
                placeholder="Product name"
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-sm font-medium text-zinc-300">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getInputClassName("category")} h-10`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {touched.category && errors.category && (
                <p className="text-xs text-red-400 mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <label htmlFor="headline" className="block text-sm font-medium text-zinc-300">
              Headline <span className="text-red-400">*</span>
            </label>
            <input
              id="headline"
              name="headline"
              type="text"
              value={formData.headline}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${getInputClassName("headline")} h-10`}
              placeholder="Brief description"
            />
            {touched.headline && errors.headline && (
              <p className="text-xs text-red-400 mt-1">{errors.headline}</p>
            )}
          </div>

          {/* Process Time and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="processTime" className="block text-sm font-medium text-zinc-300">
                Process Time <span className="text-red-400">*</span>
              </label>
              <input
                id="processTime"
                name="processTime"
                type="text"
                value={formData.processTime}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getInputClassName("processTime")} h-10`}
                placeholder="e.g., 2-3 weeks"
              />
              {touched.processTime && errors.processTime && (
                <p className="text-xs text-red-400 mt-1">{errors.processTime}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-sm font-medium text-zinc-300">
                Price ($) <span className="text-red-400">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getInputClassName("price")} h-10`}
                placeholder="0.00"
              />
              {touched.price && errors.price && (
                <p className="text-xs text-red-400 mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <label htmlFor="image" className="block text-sm font-medium text-zinc-300">
              Product Image <span className="text-red-400">*</span>
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-800">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-zinc-600" />
                </div>
              )}
              <div className="flex-1">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={`${getInputClassName("image")} h-10 file:mr-3 file:border-0 file:bg-zinc-800 file:text-zinc-300 file:text-sm file:font-medium file:px-3 file:py-1 file:rounded cursor-pointer`}
                />
                <p className="text-xs text-zinc-500 mt-1">Max 5MB. JPG, PNG, or WebP.</p>
                {touched.image && errors.image && (
                  <p className="text-xs text-red-400 mt-1">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-1.5">
            <label htmlFor="requiredDocs" className="block text-sm font-medium text-zinc-300">
              Required Documents <span className="text-red-400">*</span>
            </label>
            <input
              id="requiredDocs"
              name="requiredDocs"
              type="text"
              value={formData.requiredDocs}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${getInputClassName("requiredDocs")} h-10`}
              placeholder="Passport, Photo, Application form"
            />
            <p className="text-xs text-zinc-500">Separate documents with commas</p>
            {touched.requiredDocs && errors.requiredDocs && (
              <p className="text-xs text-red-400 mt-1">{errors.requiredDocs}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${getInputClassName("description")} py-2 resize-none`}
              placeholder="Detailed product description..."
            />
            {touched.description && errors.description && (
              <p className="text-xs text-red-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Link
              href="/admin/products"
              className="px-4 py-2 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
