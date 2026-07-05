"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  category: string;
  headline: string;
  processTime: string;
  price: number;
  image: string;
  createdAt?: number;
};

const ITEMS_PER_PAGE = 10;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Plain query: orderBy("createdAt") would exclude items that don't have
    // the field (all the older seeded products) — sorting happens below
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
          createdAt: data.createdAt,
        });
      });
      // Sort by createdAt descending, fallback to putting items without createdAt at the end
      itemsArr.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      setProducts(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeleting(id);
    try {
      await deleteDoc(doc(db, "items", id));
      toast.success("Product deleted successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const productsTotalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (productsPage - 1) * ITEMS_PER_PAGE,
    productsPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Products</h1>
          <p className="text-sm text-zinc-400">{products.length} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Image
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Process Time
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
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
                    <div className="text-xs text-zinc-500 truncate max-w-50">
                      {prod.headline}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 capitalize">
                      {prod.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">${prod.price}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{prod.processTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/products/${prod.id}`}
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        disabled={deleting === prod.id}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No products found. Click &quot;Add Product&quot; to create one.
                  </td>
                </tr>
              )}
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
                onClick={() =>
                  setProductsPage((prev) => Math.min(prev + 1, productsTotalPages))
                }
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
  );
};

export default ProductsPage;
