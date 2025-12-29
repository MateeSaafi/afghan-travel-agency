"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
  headline: string;
  processTime: string;
  price: number;
  image: string | File;
  requiredDocs: string;
  description: string;
};

const ITEMS_PER_PAGE = 10;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Product>({
    id: "",
    name: "",
    category: "",
    headline: "",
    processTime: "",
    price: 0,
    image: "",
    requiredDocs: "",
    description: "",
  });
  const [unfilled, setUnfilled] = useState<string>("");

  const storage = getStorage();

  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsArr: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        itemsArr.push({
          id: docSnap.id,
          name: data.name,
          category: data.category,
          headline: data.headline,
          processTime: data.processTime,
          price: data.price,
          image: data.image,
          requiredDocs: data.requiredDocs,
          description: data.description,
        });
      });
      setProducts(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  const addProduct = async () => {
    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.headline ||
      !productForm.processTime ||
      !productForm.price ||
      !productForm.requiredDocs
    ) {
      setUnfilled("Please fill in all required fields.");
      setTimeout(() => setUnfilled(""), 5000);
      return;
    }
    const imageInput = document.getElementById("imageInput") as HTMLInputElement;
    const imageFile = imageInput?.files?.[0];
    if (!imageFile) {
      setUnfilled("Please select an image.");
      setTimeout(() => setUnfilled(""), 5000);
      return;
    }
    try {
      const storageRef = ref(storage, "images/" + imageFile.name);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);
      const requiredDocsArray = productForm.requiredDocs.split(/[,\u060C\u060D]/);
      await addDoc(collection(db, "items"), {
        name: productForm.name,
        category: productForm.category.replaceAll(" ", ""),
        headline: productForm.headline,
        processTime: productForm.processTime,
        price: productForm.price,
        image: imageUrl,
        requiredDocs: requiredDocsArray,
        description: productForm.description,
      });
      toast.success("Product added successfully!");
      setProductForm({
        id: "",
        name: "",
        category: "",
        headline: "",
        processTime: "",
        price: 0,
        image: "",
        requiredDocs: "",
        description: "",
      });
      setIsAddingProduct(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateProduct = async () => {
    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.headline ||
      !productForm.processTime ||
      !productForm.price ||
      !productForm.requiredDocs
    ) {
      setUnfilled("Please fill all the fields.");
      setTimeout(() => setUnfilled(""), 3000);
      return;
    }
    try {
      const requiredDocsArray =
        typeof productForm.requiredDocs === "string"
          ? productForm.requiredDocs.split(/[,\u060C\u060D]/)
          : productForm.requiredDocs;
      if (productForm.image instanceof File) {
        const storageRef = ref(storage, "images/" + productForm.image.name);
        await uploadBytes(storageRef, productForm.image);
        productForm.image = await getDownloadURL(storageRef);
      }
      const docRef = doc(db, "items", productForm.id);
      await updateDoc(docRef, {
        name: productForm.name,
        category: productForm.category.replaceAll(" ", ""),
        headline: productForm.headline,
        processTime: productForm.processTime,
        price: productForm.price,
        image: productForm.image,
        requiredDocs: requiredDocsArray,
        description: productForm.description,
      });
      toast.success("Product updated successfully!");
      setEditingProduct(null);
      setProductForm({
        id: "",
        name: "",
        category: "",
        headline: "",
        processTime: "",
        price: 0,
        image: "",
        requiredDocs: "",
        description: "",
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "items", id));
      toast.success("Product deleted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const productsTotalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (productsPage - 1) * ITEMS_PER_PAGE,
    productsPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Products</h1>
            <p className="text-sm text-zinc-400">{products.length} total</p>
          </div>
          <button
            onClick={() => {
              setIsAddingProduct(true);
              setEditingProduct(null);
              setProductForm({
                id: "",
                name: "",
                category: "",
                headline: "",
                processTime: "",
                price: 0,
                image: "",
                requiredDocs: "",
                description: "",
              });
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Process Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <img
                        src={typeof prod.image === "string" ? prod.image : ""}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-zinc-200">{prod.name}</div>
                      <div className="text-xs text-zinc-500">{prod.headline}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{prod.category}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">${prod.price}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{prod.processTime}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setProductForm(prod);
                            setIsAddingProduct(false);
                          }}
                          className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteProduct(prod.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {productsTotalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">
                Page {productsPage} of {productsTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={productsPage === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setProductsPage((prev) => Math.min(prev + 1, productsTotalPages))}
                  disabled={productsPage === productsTotalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                  setProductForm({
                    id: "",
                    name: "",
                    category: "",
                    headline: "",
                    processTime: "",
                    price: 0,
                    image: "",
                    requiredDocs: "",
                    description: "",
                  });
                }}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  >
                    <option disabled value="">Select a category</option>
                    <option value="visa">Visa</option>
                    <option value="ticket">Ticket</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="asylum">Asylum</option>
                    <option value="form">Online Form</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">Headline</label>
                <input
                  type="text"
                  value={productForm.headline}
                  onChange={(e) => setProductForm({ ...productForm, headline: e.target.value })}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Process Time</label>
                  <input
                    type="text"
                    value={productForm.processTime}
                    onChange={(e) => setProductForm({ ...productForm, processTime: e.target.value })}
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Price</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: +e.target.value })}
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">Image File</label>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProductForm({ ...productForm, image: file });
                    }
                  }}
                  required={!editingProduct}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-400 file:mr-3 file:border-0 file:bg-zinc-800 file:text-zinc-300 file:text-sm file:font-medium file:px-2 file:py-1 file:rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">Required Documents</label>
                <input
                  type="text"
                  placeholder="Comma-separated list"
                  value={productForm.requiredDocs}
                  onChange={(e) => setProductForm({ ...productForm, requiredDocs: e.target.value })}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors resize-none"
                />
              </div>
              {unfilled && <p className="text-sm text-red-400 text-center">{unfilled}</p>}
            </form>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                  setProductForm({
                    id: "",
                    name: "",
                    category: "",
                    headline: "",
                    processTime: "",
                    price: 0,
                    image: "",
                    requiredDocs: "",
                    description: "",
                  });
                }}
                className="px-3 py-2 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (editingProduct) {
                    setSubmitting(true);
                    updateProduct();
                    setSubmitting(false);
                  } else {
                    setSubmitting(true);
                    addProduct();
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingProduct ? (submitting ? "Updating..." : "Update Product") : (submitting ? "Adding" : "Add Product")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsPage;
