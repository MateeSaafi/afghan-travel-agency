"use client";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
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
import { toast } from "react-toastify";
import { useUserStore } from "../store/userStore";

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

type UserType = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  role?: "user" | "admin" | "superadmin";
};

type Message = {
  sender: "admin" | "user";
  content: string;
  timestamp: any;
};

type DocumentType = {
  name: string;
  url: string;
  uploadedAt: any;
};

type AppointmentType = {
  id: string;
  name: string;
  email: string;
  itemId: string;
  itemName?: string;
  phone: string;
  notes?: string;
  status: "pending" | "processing" | "documents_requested" | "documents_uploaded" | "approved" | "rejected";
  createdAt: any;
  messages: Message[];
  documents: DocumentType[];
  requestedDocs?: string[];
  adminNote?: string;
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  documents_requested: { label: "Docs Needed", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  documents_uploaded: { label: "Under Review", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const ITEMS_PER_PAGE = 10;

const AdminPage: React.FC = () => {
  const router = useRouter();
  const [user, loadingAuth] = useAuthState(auth);
  const { role, isLoadingRole, fetchUserRole } = useUserStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);


  // Fetch user role when user is loaded
  useEffect(() => {
    if (user?.email) {
      fetchUserRole(user.email);
    }
  }, [user, fetchUserRole]);

  // Redirect if not admin or superadmin
  useEffect(() => {
    if (!loadingAuth && !isLoadingRole) {
      if (!user || (role !== "admin" && role !== "superadmin")) {
        router.replace("/");
      }
    }
  }, [loadingAuth, isLoadingRole, user, role, router]);

  // Function to update user role (superadmin only)
  const updateUserRole = async (userId: string, newRole: "user" | "admin") => {
    if (role !== "superadmin") {
      toast.error("Only superadmins can change user roles");
      return;
    }
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersArr: UserType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserType[];
      setUsers(usersArr);
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "users", icon: Users, label: "Users" },
    { id: "products", icon: ShoppingCart, label: "Products" },
    { id: "appointments", icon: CalendarDays, label: "Apppointments" },
  ];

  // Product management states
  const [products, setProducts] = useState<Product[]>([]);
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

  // Listen for product changes
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

  // Listen for user profiles (in "users" collection)
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersArr: UserType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersArr.push({
          id: docSnap.id,
          email: data.email,
          name: data.name,
          createdAt: data.createdAt,
          role: data.role || "user",
        });
      });
      setUsers(usersArr);
    });
    return () => unsubscribe();
  }, []);

  // Listen for appointments (in "appointments" collection)
  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsArr: AppointmentType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Find product name
        const prod = products.find((p) => p.id === data.itemId);
        appointmentsArr.push({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          itemId: data.itemId,
          itemName: prod?.name,
          phone: data.phone,
          notes: data.notes,
          status: data.status || "pending",
          createdAt: data.createdAt,
          messages: data.messages || [],
          documents: data.documents || [],
          requestedDocs: data.requestedDocs || [],
          adminNote: data.adminNote,
        });
      });
      // Sort by createdAt descending
      appointmentsArr.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setAppointments(appointmentsArr);
    });
    return () => unsubscribe();
  }, [products]);

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
    // Upload image if file selected
    const imageInput = document.getElementById(
      "imageInput"
    ) as HTMLInputElement;
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
      const requiredDocsArray =
        productForm.requiredDocs.split(/[,\u060C\u060D]/);
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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Total Users",
                  value: String(users.length || 0),
                  change: `+${
                    ((users.length -
                      users.filter(
                        (user) =>
                          new Date(user.createdAt).toDateString() ===
                          new Date().toDateString()
                      ).length) /
                      users.length) *
                    100
                  }%`,
                },
                {
                  title: "Total Products",
                  value: String(products.length || 0),
                  change: "",
                },
                {
                  title: "Total Appointments",
                  value: String(appointments.length || 0),
                  change: "",
                },
                {
                  title: "Pending",
                  value: appointments.filter(
                    (app) => app.status === "pending" || app.status === "documents_uploaded"
                  ).length,
                  change: "",
                },
              ].map((card, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
                  <h3 className="text-zinc-400 text-sm font-medium">{card.title}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-semibold text-zinc-100">{card.value}</span>
                    {card.change && (
                      <span
                        className={`text-xs font-medium ${
                          card.change.startsWith("+")
                            ? "text-emerald-500"
                            : "text-zinc-500"
                        }`}
                      >
                        {card.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100">Pending Appointments</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Package</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(
                          (appointment) =>
                            appointment.status === "pending" || appointment.status === "documents_uploaded"
                        )
                        .slice(0, 5)
                        .map((appointment) => (
                          <tr
                            key={appointment.id}
                            className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-zinc-200">{appointment.itemName || "Unknown"}</div>
                              <div className="text-xs text-zinc-500">{appointment.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-zinc-300">{appointment.name}</div>
                              <div className="text-xs text-zinc-500">{appointment.phone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[appointment.status].color}`}>
                                {statusConfig[appointment.status].label}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100">Latest Users</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-zinc-300">{user.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{user.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100">Latest Products</h2>
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
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map((prod) => (
                        <tr
                          key={prod.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <img
                              src={
                                typeof prod.image === "string" ? prod.image : ""
                              }
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-md"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-zinc-200">{prod.name}</div>
                            <div className="text-xs text-zinc-500">
                              {prod.headline}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{prod.category}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">${prod.price}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{prod.processTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case "users":
        const usersTotalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
        const paginatedUsers = users.slice(
          (usersPage - 1) * ITEMS_PER_PAGE,
          usersPage * ITEMS_PER_PAGE
        );
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-zinc-100">Users</h1>
              <span className="text-sm text-zinc-400">{users.length} total</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                      {role === "superadmin" && (
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-300">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{u.name || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              u.role === "superadmin"
                                ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                : u.role === "admin"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        {role === "superadmin" && (
                          <td className="px-4 py-3">
                            {u.role !== "superadmin" && (
                              <div className="flex gap-2">
                                {u.role === "admin" ? (
                                  <button
                                    onClick={() => updateUserRole(u.id, "user")}
                                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                                  >
                                    Demote
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateUserRole(u.id, "admin")}
                                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
                                  >
                                    Make Admin
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usersTotalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
                  <span className="text-sm text-zinc-500">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                      disabled={usersPage === 1}
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setUsersPage((prev) => Math.min(prev + 1, usersTotalPages))}
                      disabled={usersPage === usersTotalPages}
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
      case "products":
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
                            src={
                              typeof prod.image === "string" ? prod.image : ""
                            }
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-zinc-200">{prod.name}</div>
                          <div className="text-xs text-zinc-500">
                            {prod.headline}
                          </div>
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
        );
      case "appointments":
        const appointmentsTotalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);
        const paginatedAppointments = appointments.slice(
          (appointmentsPage - 1) * ITEMS_PER_PAGE,
          appointmentsPage * ITEMS_PER_PAGE
        );
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-zinc-100">Appointments</h1>
              <span className="text-sm text-zinc-400">{appointments.length} total</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Package</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-zinc-200">{appointment.itemName || "Unknown"}</div>
                          <div className="text-xs text-zinc-500">{appointment.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-zinc-300">{appointment.name}</div>
                          <div className="text-xs text-zinc-500">{appointment.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[appointment.status].color}`}>
                            {statusConfig[appointment.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/appointments/${appointment.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {appointmentsTotalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
                  <span className="text-sm text-zinc-500">
                    Page {appointmentsPage} of {appointmentsTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAppointmentsPage((prev) => Math.max(prev - 1, 1))}
                      disabled={appointmentsPage === 1}
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setAppointmentsPage((prev) => Math.min(prev + 1, appointmentsTotalPages))}
                      disabled={appointmentsPage === appointmentsTotalPages}
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
      default:
        return <div>Select a menu item from the sidebar</div>;
    }
  };

  // Sidebar toggle handler
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex mt-14">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-60" : "w-16"
        } bg-zinc-900 border-r border-zinc-800/80 transition-all duration-200 fixed h-[calc(100vh-56px)]`}
      >
        <div className="h-12 px-3 flex items-center justify-between border-b border-zinc-800/80">
          <span
            className={`text-sm font-semibold text-zinc-400 ${!isSidebarOpen && "hidden"}`}
          >
            Navigation
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-3 py-2 flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              <item.icon
                size={18}
                className={activeTab === item.id ? "text-zinc-100" : ""}
              />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
      {/* Main Content */}
      <div
        className={`flex-1 ${
          isSidebarOpen ? "ml-60" : "ml-16"
        } transition-all duration-200`}
      >
        {/* Content Area */}
        <div className="p-6">{renderContent()}</div>
      </div>
      {/* Product Modal (for adding/editing) */}
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
                  <label className="block text-sm font-medium text-zinc-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
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
                <label className="block text-sm font-medium text-zinc-300">
                  Headline
                </label>
                <input
                  type="text"
                  value={productForm.headline}
                  onChange={(e) =>
                    setProductForm({ ...productForm, headline: e.target.value })
                  }
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Process Time
                  </label>
                  <input
                    type="text"
                    value={productForm.processTime}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        processTime: e.target.value,
                      })
                    }
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Price
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: +e.target.value })
                    }
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  Image File
                </label>
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
                <label className="block text-sm font-medium text-zinc-300">
                  Required Documents
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated list"
                  value={productForm.requiredDocs}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      requiredDocs: e.target.value,
                    })
                  }
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors resize-none"
                />
              </div>
              {unfilled && (
                <p className="text-sm text-red-400 text-center">{unfilled}</p>
              )}
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
                  {editingProduct
                    ? submitting
                      ? "Updating..."
                      : "Update Product"
                    : submitting
                    ? "Adding"
                    : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
