
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getOrderById,
  updateResidentOrder,
  type Order,
} from "../services/orderService";
import {
  getResidentProducts,
  getProductImageUrl,
  type Product,
} from "../services/residentService";
import "./OrderDetailsPage.css";

interface DraftItem {
  product: Product;
  quantity: number;
  originalQuantity: number;
}

const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
        setError("Invalid order.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getOrderById(Number(orderId));
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to fetch order:", err);
        setError(
          err.response?.data?.detail ||
          "Unable to load order details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Fetch available products while searching in edit mode.
  useEffect(() => {
    if (!editMode) return;

    const timeout = setTimeout(async () => {
      try {
        setLoadingProducts(true);

        const products = await getResidentProducts(productSearch);
        setAvailableProducts(products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setEditError("Unable to load available products.");
      } finally {
        setLoadingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [editMode, productSearch]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatAmount = (amount: number | string | null) =>
    `₹${Number(amount ?? 0).toFixed(2)}`;

  const getStatusClass = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "CONFIRMED":
        return "confirmed";
      case "DISPATCHED":
        return "dispatched";
      default:
        return "";
    }
  };

  const startEditing = async () => {
    if (!order) return;

    setEditError("");
    setSuccessMessage("");
    setProductSearch("");

    try {
      setLoadingProducts(true);

      const products = await getResidentProducts("");
      setAvailableProducts(products);

      const initialDraft: DraftItem[] = order.items.map((item) => {
        const availableProduct = products.find(
          (product) => product.id === item.product_id
        );

        // Existing products must remain editable even if they
        // are no longer available in the catalogue.
        const product: Product = availableProduct ?? {
          id: item.product.id,
          name: item.product.name,
          description: null,
          image_url: item.product.image_url,
          unit: "unit",
          retail_price: item.retail_price,
          stock_on_hand: item.quantity,
          stock_reserved: item.quantity,
          is_active: true,
        };

        return {
          product,
          quantity: item.quantity,
          originalQuantity: item.quantity,
        };
      });

      setDraftItems(initialDraft);
      setEditMode(true);
    } catch (err) {
      console.error("Unable to start editing:", err);
      setEditError("Unable to load products. Please try again.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const changeQuantity = (productId: number, change: number) => {
    setDraftItems((previous) =>
      previous.map((item) => {
        if (item.product.id !== productId) return item;

        const availableStock =
          item.product.stock_on_hand -
          item.product.stock_reserved +
          item.originalQuantity;

        const nextQuantity = item.quantity + change;

        if (nextQuantity < 1 || nextQuantity > availableStock) {
          return item;
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      })
    );
  };

  const removeItem = (productId: number) => {
    setDraftItems((previous) =>
      previous.filter((item) => item.product.id !== productId)
    );
  };

  const addProduct = (product: Product) => {
    setDraftItems((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        const availableStock =
          product.stock_on_hand -
          product.stock_reserved +
          existing.originalQuantity;

        if (existing.quantity >= availableStock) {
          return previous;
        }

        return previous.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          product,
          quantity: 1,
          originalQuantity: 0,
        },
      ];
    });
  };

  const draftTotal = draftItems.reduce(
    (total, item) =>
      total + Number(item.product.retail_price) * item.quantity,
    0
  );

  const draftItemCount = draftItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const saveChanges = async () => {
    if (!order) return;

    if (draftItems.length === 0) {
      setEditError("Your order must contain at least one product.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");
      setSuccessMessage("");

      const updatedOrder = await updateResidentOrder(
        order.id,
        draftItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        }))
      );

      setOrder(updatedOrder);
      setEditMode(false);
      setSuccessMessage("Your order has been updated successfully.");
    } catch (err: any) {
      console.error("Failed to update order:", err);

      setEditError(
        err.response?.data?.detail ||
        "Unable to update your order. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditMode(false);
    setDraftItems([]);
    setProductSearch("");
    setEditError("");
  };

  if (loading) {
    return (
      <div className="order-details-message">
        <div className="orders-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-message">
        <h2>Unable to load order</h2>
        <p>{error || "This order could not be found."}</p>
        <button onClick={() => navigate("/resident/orders")}>
          Back to My Orders
        </button>
      </div>
    );
  }

  const totalItems = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const progressSteps = [
    { label: "Order placed", status: "PENDING" },
    { label: "Order confirmed", status: "CONFIRMED" },
    { label: "Dispatched", status: "DISPATCHED" },
  ];

  const currentStep = progressSteps.findIndex(
    (step) => step.status === order.status
  );

  return (
    <div className="order-details-page">
      <button
        className="back-to-orders"
        onClick={() => navigate("/resident/orders")}
      >
        ← Back to My Orders
      </button>

      {successMessage && (
        <div className="order-edit-success">
          ✓ {successMessage}
        </div>
      )}

      <div className="details-header">
        <div>
          <h1>Order Details</h1>
          <p>Placed on {formatDate(order.order_date)}</p>
        </div>

        <span className={`order-status ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      <section className="order-progress">
        <h2>Order status</h2>

        <div className="progress-steps">
          {progressSteps.map((step, index) => (
            <div
              className={`progress-step ${
                index <= currentStep ? "completed" : ""
              }`}
              key={step.status}
            >
              <div className="progress-indicator">
                {index < currentStep ? "✓" : index + 1}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ordered-products">
        <div className="section-heading">
          <div>
            <h2>{editMode ? "Edit your order" : "Items ordered"}</h2>
            <span>
              {editMode ? draftItemCount : totalItems} items
            </span>
          </div>

          {!editMode && order.status === "PENDING" && (
            <button
              className="edit-order-button"
              onClick={startEditing}
              disabled={loadingProducts}
            >
              Edit Order
            </button>
          )}
        </div>

        {editMode ? (
          <>
            <p className="edit-instructions">
              Change quantities or remove products from your order.
            </p>

            <div className="ordered-products-list">
              {draftItems.map((item) => {
                const imageUrl = getProductImageUrl(
                  item.product.image_url
                );

                const availableStock =
                  item.product.stock_on_hand -
                  item.product.stock_reserved +
                  item.originalQuantity;

                return (
                  <div className="ordered-product edit-product" key={item.product.id}>
                    <div className="ordered-product-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product.name} />
                      ) : (
                        <div className="product-image-placeholder">🛍️</div>
                      )}
                    </div>

                    <div className="ordered-product-info">
                      <h3>{item.product.name}</h3>
                      <p>
                        {formatAmount(item.product.retail_price)} / {item.product.unit}
                      </p>

                      <div className="quantity-controls">
                        <button
                          onClick={() => changeQuantity(item.product.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease ${item.product.name} quantity`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() => changeQuantity(item.product.id, 1)}
                          disabled={item.quantity >= availableStock}
                          aria-label={`Increase ${item.product.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="edit-product-actions">
                      <strong>
                        {formatAmount(
                          Number(item.product.retail_price) * item.quantity
                        )}
                      </strong>

                      <button
                        className="remove-order-item"
                        onClick={() => removeItem(item.product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="add-products-section">
              <h3>Add more products</h3>

              <input
                type="text"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search products..."
              />

              {loadingProducts ? (
                <p className="edit-muted">Loading products...</p>
              ) : (
                <div className="available-products-list">
                  {availableProducts
                    .filter((product) => {
                      const alreadyAdded = draftItems.some(
                        (item) => item.product.id === product.id
                      );

                      return !alreadyAdded && product.is_active;
                    })
                    .map((product) => (
                      <div className="available-product" key={product.id}>
                        <div>
                          <strong>{product.name}</strong>
                          <p>
                            {formatAmount(product.retail_price)} / {product.unit}
                          </p>
                        </div>

                        <button onClick={() => addProduct(product)}>
                          + Add
                        </button>
                      </div>
                    ))}

                  {availableProducts.filter(
                    (product) =>
                      !draftItems.some(
                        (item) => item.product.id === product.id
                      )
                  ).length === 0 && (
                    <p className="edit-muted">
                      No additional available products found.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="edit-order-total">
              <span>Updated order total</span>
              <strong>{formatAmount(draftTotal)}</strong>
            </div>

            {editError && (
              <div className="order-edit-error">{editError}</div>
            )}

            <div className="edit-order-actions">
              <button
                className="cancel-edit-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="save-edit-button"
                onClick={saveChanges}
                disabled={saving || draftItems.length === 0}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <div className="ordered-products-list">
            {order.items.map((item) => {
              const unitPrice =
                item.final_unit_price ?? item.retail_price;

              const lineTotal =
                Number(unitPrice) * item.quantity;

              const imageUrl = item.product.image_url
                ? getProductImageUrl(item.product.image_url)
                : null;

              return (
                <div className="ordered-product" key={item.id}>
                  <div className="ordered-product-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        🛍️
                      </div>
                    )}
                  </div>

                  <div className="ordered-product-info">
                    <h3>{item.product.name}</h3>
                    <p>
                      {formatAmount(unitPrice)} × {item.quantity}
                    </p>
                  </div>

                  <strong>{formatAmount(lineTotal)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!editMode && (
        <section className="order-summary">
          <h2>Payment summary</h2>

          <div className="summary-row">
            <span>Original order amount</span>
            <span>{formatAmount(order.total_amount)}</span>
          </div>

          <div className="summary-row">
            <span>Final order amount</span>
            <span>
              {order.final_amount !== null
                ? formatAmount(order.final_amount)
                : "Pending settlement"}
            </span>
          </div>

          <div className="summary-row cashback-row">
            <span>Cashback earned</span>
            <span>{formatAmount(order.cashback_amount)}</span>
          </div>

          <div className="summary-total">
            <span>
              {order.final_amount !== null
                ? "Final amount"
                : "Amount paid"}
            </span>
            <strong>
              {formatAmount(order.final_amount ?? order.total_amount)}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
};

export default OrderDetailsPage;
