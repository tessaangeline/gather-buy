
import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, adjustProductStock, updateProductStatus, getProductStats } from "./productService";
import type { Product, CreateProductData, ProductStats } from "./productService";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import "./ProductsPage.css";

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateProductData>({ 
    name: "",
    description: "",
    unit: "",
    retail_price: 0,
    stock_on_hand: 0,
    });

  const [selectedImage, setSelectedImage] = useState<File | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    unit: "",
    retail_price: "",
    });

   const [editImage, setEditImage] = useState<File | undefined>();
   const [updating, setUpdating] = useState(false);
   const [stockProduct, setStockProduct] = useState<Product | null>(null);
   const [stockOperation, setStockOperation] = useState<"ADD" | "REMOVE">("ADD");
   const [stockQuantity, setStockQuantity] = useState("");
   const [adjustingStock, setAdjustingStock] = useState(false);
   const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
   const [searchTerm, setSearchTerm] = useState("");
   const [availabilityFilter, setAvailabilityFilter] = useState("");
   

  // Fetch products from the backend
  const fetchProducts = async (
    page: number = currentPage,
    search: string = searchTerm,
    availability: string = availabilityFilter
    ) => {
    try {
        setLoading(true);
        setError("");

        const skip = (page - 1) * pageSize;

        const data = await getProducts(
        skip,
        pageSize,
        search,
        availability
        );

        setProducts(data);
        setHasNextPage(data.length === pageSize);
    } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Unable to load products. Please try again.");
    } finally {
        setLoading(false);
    }
    };

    const fetchProductStats = async () => {
    try {
        const data = await getProductStats();
        setStats(data);
    } catch (err) {
        console.error("Failed to fetch product statistics:", err);
    }
};
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
    };

    const handleCreateProduct = async (
        event: React.FormEvent<HTMLFormElement>
        ) => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            await createProduct({
            ...formData,
            retail_price: Number(formData.retail_price),
            stock_on_hand: Number(formData.stock_on_hand),
            file: selectedImage,
            });

            setFormData({
            name: "",
            description: "",
            unit: "",
            retail_price: 0,
            stock_on_hand: 0,
            });

            setSelectedImage(undefined);
            setShowAddForm(false);

            setCurrentPage(1);
            await fetchProducts(1);
            await fetchProductStats();


        } catch (err: any) {
        console.error("Create product error:", err);

        const detail = err.response?.data?.detail;

        console.log(
            "Validation details:",
            JSON.stringify(detail, null, 2)
        );

        if (Array.isArray(detail)) {
            setError(
            detail
                .map((item: any) => {
                const field = item.loc?.at(-1) || "Field";
                return `${field}: ${item.msg}`;
                })
                .join(" | ")
            );
        } else if (typeof detail === "string") {
            setError(detail);
        } else {
            setError("Unable to create product. Please try again.");
        }
        }
    }

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);

        setEditFormData({
            name: product.name,
            description: product.description || "",
            unit: product.unit,
            retail_price: String(product.retail_price),
        });

        setEditImage(undefined);
        setError("");
        };

    const handleUpdateProduct = async (
        event: React.FormEvent<HTMLFormElement>
        ) => {
        event.preventDefault();

        if (!editingProduct) return;

        try {
            setUpdating(true);
            setError("");

            await updateProduct(editingProduct.id, {
            ...editFormData,
            retail_price: Number(editFormData.retail_price),
            file: editImage,
            });

            setEditingProduct(null);
            setEditImage(undefined);

            await fetchProducts(currentPage);
        } catch (err: any) {
            console.error("Update product error:", err);

            const detail = err.response?.data?.detail;

            setError(
            Array.isArray(detail)
                ? detail.map((item: any) => `${item.loc?.at(-1)}: ${item.msg}`).join(" | ")
                : typeof detail === "string"
                ? detail
                : "Unable to update product."
            );
        } finally {
            setUpdating(false);
        }
        };

        const handleStockAdjustment = async (
            event: React.FormEvent<HTMLFormElement>
            ) => {
            event.preventDefault();

            if (!stockProduct || !stockQuantity) return;

            const quantity = Number(stockQuantity);

            if (!Number.isInteger(quantity) || quantity <= 0) {
                setError("Please enter a valid positive whole number.");
                return;
            }

            try {
                setAdjustingStock(true);
                setError("");

                await adjustProductStock(
                stockProduct.id,
                quantity,
                stockOperation
                );

                setStockProduct(null);
                setStockQuantity("");

                await fetchProducts(currentPage);
                await fetchProductStats();

            } catch (err: any) {
                console.error("Stock adjustment error:", err);

                const detail = err.response?.data?.detail;

                setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to adjust stock. Please try again."
                );
            } finally {
                setAdjustingStock(false);
            }
            };

        const handleProductStatus = async (product: Product) => {
            try {
                setError("");

                await updateProductStatus(
                product.id,
                !product.is_active
                );

                await fetchProducts(currentPage);
                await fetchProductStats();
                
            } catch (err: any) {
                console.error("Product status update error:", err);

                const detail = err.response?.data?.detail;

                setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to update product status."
                );
            }
            };

  // Fetch products when the page loads
  useEffect(() => {
    fetchProducts();
    fetchProductStats();
  }, [currentPage]);

  return (
    <DashboardLayout title="Products">
      <div className="products-page">

        {/* Page Header */}
        <div className="products-page-header">
          <div>
            <h2>Products</h2>
            <p>Manage your product catalogue and inventory.</p>
          </div>

          <button
            className="add-product-btn"
            onClick={() => {
                console.log("Add Product clicked");
                setShowAddForm(true);
            }}
          >
            + Add Product
          </button>
        </div>

        {/* Add Product Form Placeholder */}
        {showAddForm && (
        <form
            className="product-form-container"
            onSubmit={handleCreateProduct}
        >
            <h3>Add New Product</h3>

            <label>Product Name</label>
            <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
            />

            <label>Description</label>
            <textarea
            name="description"
            value={formData.description ?? ""}
            onChange={handleInputChange}
            placeholder="Enter product description"
            />

            <label>Unit</label>
            <input
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            placeholder="e.g. kg, litre, packet"
            required
            />

            <label>Retail Price (₹)</label>
            <input
            type="number"
            name="retail_price"
            value={formData.retail_price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
            />

            <label>Initial Stock</label>
            <input
            type="number"
            name="stock_on_hand"
            value={formData.stock_on_hand}
            onChange={handleInputChange}
            min="0"
            required
            />

            <label>Product Image</label>
            <input
            type="file"
            accept="image/*"
            onChange={(event) =>
                setSelectedImage(event.target.files?.[0])
            }
            />

            <div className="product-form-actions">
            <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
            >
                Cancel
            </button>

            <button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Product"}
            </button>
            </div>
        </form>
        )}

        
{editingProduct && (
  <form
    className="product-form-container edit-product-form"
    onSubmit={handleUpdateProduct}
  >
    <h3>Edit Product</h3>

    {/* Product information and image */}
    <div className="edit-product-header">
      {editImage ? (
        <img
          src={URL.createObjectURL(editImage)}
          alt="Selected product"
          className="edit-product-image"
        />
      ) : editingProduct.image_url ? (
        <img
          src={
            editingProduct.image_url.startsWith("http")
              ? editingProduct.image_url
              : `http://localhost:8000${editingProduct.image_url}`
          }
          alt={editingProduct.name}
          className="edit-product-image"
        />
      ) : (
        <div className="edit-product-image-placeholder">
          No image
        </div>
      )}

      <div className="edit-product-heading">
        <h4>{editingProduct.name}</h4>
        <p>Update product information</p>
      </div>
    </div>

    {/* Form fields */}
    <div className="edit-product-grid">

      <div className="edit-field">
        <label>Product Name</label>
        <input
          name="name"
          value={editFormData.name}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              name: e.target.value,
            })
          }
          required
        />
      </div>

      <div className="edit-field">
        <label>Unit</label>
        <input
          name="unit"
          value={editFormData.unit}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              unit: e.target.value,
            })
          }
          required
        />
      </div>

      <div className="edit-field">
        <label>Retail Price (₹)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={editFormData.retail_price}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              retail_price: e.target.value,
            })
          }
          required
        />
      </div>

      <div className="edit-field full-width">
        <label>Description</label>
        <textarea
          name="description"
          value={editFormData.description}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              description: e.target.value,
            })
          }
        />
      </div>

      <div className="edit-field full-width">
        <label>Replace Product Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setEditImage(e.target.files?.[0])
          }
        />
      </div>

    </div>

    {/* Actions */}
    <div className="product-form-actions">
      <button
        type="button"
        onClick={() => {
          setEditingProduct(null);
          setEditImage(undefined);
        }}
        disabled={updating}
      >
        Cancel
      </button>

      <button type="submit" disabled={updating}>
        {updating ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </form>
)}


        {stockProduct && (
            <form
                className="product-form-container stock-form"
                onSubmit={handleStockAdjustment}
            >
                <h3>Manage Stock</h3>

                {/* Product Information */}
                <div className="stock-product-info">
                {stockProduct.image_url ? (
                    <img
                    src={`http://localhost:8000${stockProduct.image_url}`}
                    alt={stockProduct.name}
                    className="stock-product-image"
                    />
                ) : (
                    <div className="stock-product-image-placeholder">
                    No Image
                    </div>
                )}

                <div>
                    <h4>{stockProduct.name}</h4>
                    <p>{stockProduct.unit}</p>
                </div>
                </div>

                {/* Stock Overview */}
                <div className="stock-overview">
                <div className="stock-stat-card">
                    <span>Current Stock</span>
                    <h3>{stockProduct.stock_on_hand}</h3>
                </div>

                <div className="stock-stat-card reserved">
                    <span>Reserved Stock</span>
                    <h3>{stockProduct.stock_reserved}</h3>
                </div>

                <div className="stock-stat-card available">
                    <span>Available Stock</span>
                    <h3>
                    {stockProduct.stock_on_hand -
                        stockProduct.stock_reserved}
                    </h3>
                </div>
                </div>

                {/* Stock Operation */}
                <label className="stock-operation-label">
                Select Operation
                </label>

                <div className="stock-operation-options">
                <button
                    type="button"
                    className={`stock-operation-btn add-stock ${
                    stockOperation === "ADD" ? "selected" : ""
                    }`}
                    onClick={() => setStockOperation("ADD")}
                >
                    <span>+</span>
                    Add Stock
                </button>

                <button
                    type="button"
                    className={`stock-operation-btn remove-stock ${
                    stockOperation === "REMOVE" ? "selected" : ""
                    }`}
                    onClick={() => setStockOperation("REMOVE")}
                >
                    <span>−</span>
                    Remove Stock
                </button>
                </div>

                {/* Quantity */}
                <label className="stock-quantity-label">
                Quantity
                </label>

                <input
                type="number"
                min="1"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
                />

                <div className="product-form-actions">
                <button
                    type="button"
                    onClick={() => setStockProduct(null)}
                    disabled={adjustingStock}
                >
                    Cancel
                </button>

                <button type="submit" disabled={adjustingStock}>
                    {adjustingStock ? "Updating..." : "Update Stock"}
                </button>
                </div>
            </form>
            )}

        {/* Error Message */}
        {error && (
          <div className="products-error">
            <p>{error}</p>
            <button 
            type = "button" 
            onClick={() => fetchProducts(currentPage)}>
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}

        <div className="products-summary">
        <div className="summary-card">
            <h3>{stats?.total_products ?? "—"}</h3>
            <p>Total Products</p>
        </div>

        <div className="summary-card">
            <h3>{stats?.active_products ?? "—"}</h3>
            <p>Active Products</p>
        </div>

        <div className="summary-card">
            <h3>{stats?.out_of_stock ?? "—"}</h3>
            <p>Out of Stock</p>
        </div>
        </div>

        <div className="product-filters">

        <div className="product-search">
            <span>⌕</span>

            <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                fetchProducts(1, searchTerm, availabilityFilter);
                }
            }}
            />

            <button
            type="button"
            onClick={() => fetchProducts(1, searchTerm, availabilityFilter)}
            >
            Search
            </button>
        </div>

        <select
            value={availabilityFilter}
            onChange={(e) => {
            const value = e.target.value;

            setAvailabilityFilter(value);
            setCurrentPage(1);
            fetchProducts(1, searchTerm, value);
            }}
        >
            <option value="">All Products</option>
            <option value="available">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
        </select>

        <button
            type="button"
            className="clear-filters-btn"
            onClick={() => {
            setSearchTerm("");
            setAvailabilityFilter("");
            setCurrentPage(1);
            fetchProducts(1, "", "");
            }}
        >
            Clear Filters
        </button>

        </div>

        {/* Products Table */}
        <div className="products-table-container">
          <h3>Product Catalogue</h3>

          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p>Products could not be loaded.</p>
          ) : products.length === 0 ? (
            <p>No products found. Add your first product.</p>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Retail Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const availableStock =
                    product.stock_on_hand - product.stock_reserved;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-info">
                            {product.image_url ? (
                            <img
                                src={`http://localhost:8000${product.image_url}`}
                                alt={product.name}
                                className="product-thumbnail"
                            />
                            ) : (
                            <div className="product-image-placeholder">
                                No image
                            </div>
                            )}

                            <span>{product.name}</span>
                        </div>
                        </td>
                      <td>{product.unit}</td>
                      <td>
                        ₹{Number(product.retail_price).toFixed(2)}
                      </td>
                      <td>{availableStock}</td>
                      <td>
                        {product.is_active ? "Active" : "Inactive"}
                      </td>
                      <td>
                        <div className="product-actions">
  <div className="action-menu-wrapper">
    <button
      type="button"
      className="action-menu-trigger"
      onClick={() =>
        setOpenActionMenu(
          openActionMenu === product.id ? null : product.id
        )
      }
      aria-label={`Actions for ${product.name}`}
    >
      ⋮
    </button>

    {openActionMenu === product.id && (
      <div className="action-menu">
        <button
          type="button"
          onClick={() => {
            handleEditClick(product);
            setOpenActionMenu(null);
          }}
        >
          <span>✎</span> Edit Product
        </button>

        <button
          type="button"
          onClick={() => {
            setStockProduct(product);
            setStockOperation("ADD");
            setStockQuantity("");
            setError("");
            setOpenActionMenu(null);
          }}
        >
          <span>▤</span> Manage Stock
        </button>

        <div className="action-menu-divider" />

        <button
          type="button"
          className={product.is_active ? "danger-action" : "success-action"}
          onClick={() => {
            handleProductStatus(product);
            setOpenActionMenu(null);
          }}
        >
          <span>{product.is_active ? "⊘" : "✓"}</span>
          {product.is_active ? "Deactivate Product" : "Activate Product"}
        </button>
      </div>
    )}
  </div>
</div>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            
          )}

          <div className="pagination-container">
            <button
                type="button"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((prev) => prev - 1)}
            >
                Previous
            </button>

            <span>Page {currentPage}</span>

            <button
                type="button"
                disabled={!hasNextPage || loading}
                onClick={() => setCurrentPage((prev) => prev + 1)}
            >
                Next
            </button>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default ProductsPage;
