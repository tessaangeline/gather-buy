
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { topUpWallet } from "../services/walletService";
import "./WalletPage.css";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const WalletPage = () => {
  const { user, updateWalletBalance } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const walletBalance = Number(user?.wallet_balance ?? 0);

  const formatAmount = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleTopUp = async () => {
    const topUpAmount = Number(amount);

    if (!Number.isFinite(topUpAmount) || topUpAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (topUpAmount > 10000) {
      setError("Maximum top-up amount is ₹10,000.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Please enter an amount with up to 2 decimal places.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await topUpWallet(topUpAmount);

      updateWalletBalance(response.wallet_balance);

      setSuccess("Money added to your wallet successfully!");
      setAmount("");
      setShowModal(false);
    } catch (err: any) {
      console.error("Wallet top-up failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to add money. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openTopUpModal = () => {
    setError("");
    setSuccess("");
    setAmount("");
    setShowModal(true);
  };

  const closeTopUpModal = () => {
    if (loading) return;

    setShowModal(false);
    setAmount("");
    setError("");
  };

  return (
    <div className="wallet-page">

      {/* Page heading */}
      <div className="wallet-header">
        <div>
          <span className="wallet-eyebrow">YOUR ACCOUNT</span>
          <h1>My Wallet</h1>
          <p>
            Manage your balance and pay for your community orders.
          </p>
        </div>
      </div>

      {/* Wallet overview */}
      <div className="wallet-overview">

        {/* Balance card */}
        <section className="wallet-card">
          <div className="wallet-card-top">
            <div>
              <span className="wallet-label">AVAILABLE BALANCE</span>
              <h2>{formatAmount(walletBalance)}</h2>
            </div>

            <div className="wallet-icon">
              <span>₹</span>
            </div>
          </div>

          <div className="wallet-card-bottom">
            <div>
              <span className="wallet-card-caption">WALLET</span>
              <strong>Gather Buy</strong>
            </div>

            <div className="wallet-account-type">
              <span className="wallet-card-caption">ACCOUNT TYPE</span>
              <strong>Resident Account</strong>
            </div>
          </div>
        </section>

        {/* Add money panel */}
        <section className="wallet-action">
          <div className="wallet-action-icon">
            <span>+</span>
          </div>

          <span className="wallet-action-label">WALLET TOP-UP</span>

          <h3>Add money to your wallet</h3>

          <p>
            Keep your wallet ready for your next community order.
          </p>

          <button
            className="add-money-btn"
            onClick={openTopUpModal}
          >
            <span>+</span>
            Add Money
          </button>

          <small>Demo top-up. No actual payment required.</small>
        </section>
      </div>

      {/* Success message */}
      {success && (
        <div className="wallet-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* How wallet works */}
      <section className="wallet-info">
        <div className="wallet-info-heading">
          <div className="wallet-info-icon">ⓘ</div>
          <div>
            <h3>How your wallet works</h3>
            <p>A simple way to manage your community shopping payments.</p>
          </div>
        </div>

        <div className="wallet-info-grid">
          <div className="wallet-info-item">
            <span className="wallet-info-number">01</span>
            <div>
              <strong>Add money</strong>
              <p>Top up your wallet whenever you need to.</p>
            </div>
          </div>

          <div className="wallet-info-item">
            <span className="wallet-info-number">02</span>
            <div>
              <strong>Place your order</strong>
              <p>Your wallet balance is used when you order products.</p>
            </div>
          </div>

          <div className="wallet-info-item">
            <span className="wallet-info-number">03</span>
            <div>
              <strong>Receive savings</strong>
              <p>Community order savings are credited back after settlement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top-up modal */}
      {showModal && (
        <div
          className="wallet-modal-overlay"
          onClick={closeTopUpModal}
        >
          <div
            className="wallet-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="wallet-modal-header">
              <div>
                <span className="wallet-modal-eyebrow">WALLET TOP-UP</span>
                <h2>Add Money</h2>
                <p>Enter the amount you want to add.</p>
              </div>

              <button
                className="wallet-modal-close"
                onClick={closeTopUpModal}
                disabled={loading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="topup-current-balance">
              <span>Current balance</span>
              <strong>{formatAmount(walletBalance)}</strong>
            </div>

            <label htmlFor="topup-amount">Enter amount</label>

            <div className="topup-input-wrapper">
              <span>₹</span>
              <input
                id="topup-amount"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                disabled={loading}
              />
            </div>

            <div className="quick-amounts">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={Number(amount) === value ? "selected" : ""}
                  onClick={() => {
                    setAmount(String(value));
                    setError("");
                  }}
                  disabled={loading}
                >
                  ₹{value}
                </button>
              ))}
            </div>

            {error && (
              <div className="wallet-error">
                {error}
              </div>
            )}

            <button
              className="confirm-topup-btn"
              onClick={handleTopUp}
              disabled={loading || !amount.trim()}
            >
              {loading ? "Adding Money..." : "Confirm Top-up"}
            </button>

            <p className="wallet-demo-note">
              Demo wallet top-up. No actual payment will be processed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
