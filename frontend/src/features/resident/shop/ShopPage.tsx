
import { useEffect, useState } from "react";
import {
  getResidentProducts,
  getProductImageUrl,
  type Product,
} from "../services/residentService";
import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import "./ShopPage.css";

function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { items, addToCart, updateQuantity, cartCount, cartTotal } =
    useCart();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getResidentProducts(search);
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const getQuantity = (productId: number) =>
    items.find((item) => item.product.id === productId)?.quantity || 0;

  const getAvailableStock = (product: Product) =>
    product.stock_on_hand - product.stock_reserved;

  return (
    <div className="shop-page">
      <section className="shop-banner">
        <div>
          <span className="shop-banner-label">COMMUNITY SHOPPING</span>
          <h1>Groceries, together.</h1>
          <p>Order daily essentials with your community.</p>
        </div>
        <div className="shop-cutoff">
          <span>DAILY ORDER CUTOFF</span>
          <strong>9:00 PM</strong>
        </div>
      </section>

      <div className="shop-heading">
        <div>
          <h2>Shop products</h2>
          <p>Fresh essentials for your everyday needs.</p>
        </div>
      </div>

      <div className="shop-search">
        <span>⌕</span>
        <input
          type="text"
          placeholder="Search for products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")}>Clear</button>
        )}
      </div>

      {loading ? (
        <div className="shop-message">Loading products...</div>
      ) : error ? (
        <div className="shop-message shop-error">{error}</div>
      ) : products.length === 0 ? (
        <div className="shop-empty">
          <span>🛒</span>
          <h3>No products found</h3>
          <p>Try searching for something else.</p>
        </div>
      ) : (
        <>
          <p className="product-count">
            {products.length} products available
          </p>

          <div className="product-grid">
            {products.map((product) => {
              const quantity = getQuantity(product.id);
              const imageUrl = getProductImageUrl(product.image_url);

              return (
                <article className="resident-product-card" key={product.id}>
                  <div className="resident-product-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <div className="product-image-placeholder">🛍️</div>
                    )}
                  </div>

                  <div className="resident-product-info">
                    <h3>{product.name}</h3>

                    {product.description && (
                      <p className="product-description">
                        {product.description}
                      </p>
                    )}

                    <p className="product-unit">Per {product.unit}</p>

                    <div className="product-card-bottom">
                      <strong>
                        ₹{Number(product.retail_price).toFixed(2)}
                      </strong>

                      {quantity === 0 ? (
                        <button
                          className="add-button"
                          onClick={() => addToCart(product)}
                        >
                          ADD +
                        </button>
                      ) : (
                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            disabled={quantity >= getAvailableStock(product)}
                            onClick={() => addToCart(product)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {cartCount > 0 && (
        <div className="floating-cart">
          <div>
            <strong>{cartCount} items</strong>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <button onClick={() => navigate("/resident/cart")}>
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}

export default ShopPage;
