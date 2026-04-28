import React, { useState } from 'react';

/**
 * RationBundleCard: Improved UI for displaying grocery bundles.
 * Features: Expandable items, Savings badge, and Sticky CTA.
 */
const RationBundleCard = ({ bundle, isSelected, onSelect, billingCycle = 'monthly', trialDays = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock icons for visual appeal
  const getIcon = (itemName) => {
    const icons = {
      'Rice': '🌾', 'Atta': '🍞', 'Oil': '🧴', 'Dal': '🍲',
      'Sugar': '🍬', 'Salt': '🧂', 'Soap': '🧼'
    };
    return icons[itemName] || '📦';
  };

  return (
    <div className={`bundle-card ${isSelected ? 'selected' : ''}`}>
      {bundle.isPopular && (
        <div className="popular-ribbon">Most Popular</div>
      )}
      {billingCycle === 'annual' && (
        <div className="savings-badge">
          Save 20%
        </div>
      )}
      
      <div className="bundle-header">
        <div className="bundle-title-area">
          <h3>{bundle.name}</h3>
          <span className="weight-tag">{bundle.totalWeight}kg Total</span>
        </div>
        <div className="bundle-price">
          {billingCycle === 'monthly' ? (
            <>
              <span className="current-price">₹{bundle.price} <small>/mo</small></span>
            </>
          ) : (
            <>
              <span className="original-price">₹{bundle.price * 12}</span>
              <span className="current-price">₹{Math.round(bundle.price * 12 * 0.8)} <small>/yr</small></span>
            </>
          )}
        </div>
      </div>

      <div className="bundle-benefits">
        <p>✓ Monthly household essentials</p>
        <p>✓ Quality-checked staples</p>
        <p>✓ Free delivery above ₹499</p>
      </div>

      <button 
        className="view-items-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide Items ↑' : 'View Included Items ↓'}
      </button>

      {isExpanded && (
        <div className="bundle-items-list animate-fade-in">
          {bundle.items.map((item, index) => (
            <div key={index} className="bundle-item">
              <span>{getIcon(item.name)} {item.name}</span>
              <span className="item-qty">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sticky-action-area">
        {trialDays > 0 && !isSelected && (
          <button className="trial-small" onClick={() => onSelect(bundle)}>Start {trialDays}-day Trial</button>
        )}
        <button 
          className={`cta-button ${isSelected ? 'active' : ''}`}
          onClick={() => onSelect(bundle)}
        >
          {isSelected ? 'Plan Selected' : (trialDays > 0 ? 'Choose Plan' : 'Select Plan')}
        </button>
      </div>

      <style jsx>{`
        .bundle-card { border: 2px solid #eee; border-radius: 12px; padding: 20px; position: relative; background: white; transition: all 0.3s ease; }
        .bundle-card.selected { border-color: #27ae60; box-shadow: 0 6px 20px rgba(39, 174, 96, 0.12); transform: translateY(-6px); }
        .savings-badge { position: absolute; top: -12px; right: 20px; background: #f39c12; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }
        .popular-ribbon { position: absolute; left: -36px; top: 12px; background: #ff4757; color: white; padding: 8px 12px; transform: rotate(-45deg); font-weight: 700; box-shadow: 0 6px 14px rgba(0,0,0,0.08); }
        .bundle-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .bundle-price { text-align: right; }
        .original-price { text-decoration: line-through; color: #999; font-size: 0.9rem; display: block; }
        .current-price { color: #27ae60; font-size: 1.5rem; font-weight: 800; }
        .weight-tag { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; color: #666; }
        .view-items-toggle { width: 100%; background: none; border: 1px dashed #ccc; padding: 8px; margin: 15px 0; cursor: pointer; color: #555; }
        .bundle-items-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; background: #f9f9f9; border-radius: 8px; margin-bottom: 15px; }
        .bundle-item { display: flex; justify-content: space-between; font-size: 0.85rem; }
        .cta-button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #27ae60; color: white; font-weight: 700; cursor: pointer; }
        .cta-button.active { background: #2ecc71; }
        .trial-small { width: 100%; margin-bottom: 8px; padding: 10px; border-radius: 8px; border: 1px dashed #27ae60; background: #fff; color: #27ae60; cursor: pointer; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RationBundleCard;