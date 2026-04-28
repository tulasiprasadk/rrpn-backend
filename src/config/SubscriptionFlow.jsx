import React, { useState } from 'react';
import RationBundleCard from './RationBundleCard';

const SubscriptionFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const trialDays = 14;

  // Step configuration
  const steps = [
    { id: 1, label: 'Choose Plan' },
    { id: 2, label: 'Customize' },
    { id: 3, label: 'Payment' }
  ];

  const plans = [
    { id: 'basic', name: 'Basic Ration', price: 1499, savings: 200, totalWeight: 15, isPopular: false, items: [{name: 'Rice', quantity: '5kg'}, {name: 'Oil', quantity: '1L'}] },
    { id: 'standard', name: 'Standard Family', price: 2499, savings: 450, totalWeight: 26, isPopular: true, items: [{name: 'Rice', quantity: '10kg'}, {name: 'Atta', quantity: '5kg'}, {name: 'Oil', quantity: '2L'}] },
    { id: 'premium', name: 'Premium Mega', price: 4299, savings: 800, totalWeight: 45, isPopular: false, items: [{name: 'Rice', quantity: '20kg'}, {name: 'Atta', quantity: '10kg'}, {name: 'Oil', quantity: '5L'}] },
  ];

  return (
    <div className="subscription-container">
      {/* Step Indicator */}
      <div className="step-wizard">
        {steps.map((s) => (
          <div key={s.id} className={`step-item ${step >= s.id ? 'active' : ''}`}>
            <div className="step-number">{s.id}</div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="billing-controls">
        <div className="billing-toggle">
          <button className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`} onClick={() => setBillingCycle('monthly')}>Monthly</button>
          <button className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`} onClick={() => setBillingCycle('annual')}>Annual (Save 20%)</button>
        </div>
        <div className="trial-cta">
          <button className="trial-btn" onClick={() => { setSelectedPlan(plans[1]); setStep(2); }}>Start {trialDays}-day free trial</button>
        </div>
      </div>

      <div className="step-content">
        {step === 1 && (
          <div className="plans-grid">
            {plans.map(plan => (
              <RationBundleCard 
                key={plan.id}
                bundle={plan}
                billingCycle={billingCycle}
                trialDays={trialDays}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={(p) => { setSelectedPlan(p); setStep(2); }}
              />
            ))}
          </div>
        )}

        {step === 2 && selectedPlan && (
          <div className="customize-section animate-fade-in">
            <h2>Customize Your {selectedPlan.name}</h2>
            <div className="custom-basket-ui">
              <p>Selected Bundle: <strong>{selectedPlan.name}</strong></p>
              <p>Total Items: {selectedPlan.items.length}</p>
              <div className="dynamic-price-box">
                Total Payable: {billingCycle === 'monthly' ? `₹${selectedPlan.price} / month` : `₹${Math.round(selectedPlan.price * 12 * 0.8)} / year (≈ ₹${Math.round((selectedPlan.price * 12 * 0.8)/12)}/mo)`}
              </div>
              <div className="button-group">
                <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
                <button className="primary-btn" onClick={() => setStep(3)}>Confirm & Pay</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="summary-section text-center">
            <div className="success-icon">💳</div>
            <h2>Final Summary</h2>
            <div className="summary-card">
               <p>Subscription: {selectedPlan.name}</p>
               <h3>Amount: ₹{selectedPlan.price}</h3>
               <p className="note">“Subscription activates after payment confirmation”</p>
            </div>
            <button className="primary-btn large">Proceed to Payment</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .subscription-container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        .step-wizard { display: flex; justify-content: center; margin-bottom: 40px; gap: 40px; }
        .step-item { display: flex; flex-direction: column; align-items: center; color: #ccc; position: relative; }
        .step-item.active { color: #27ae60; font-weight: bold; }
        .step-number { width: 30px; height: 30px; border: 2px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
        .step-item.active .step-number { border-color: #27ae60; background: #27ae60; color: white; }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .dynamic-price-box { font-size: 1.8rem; font-weight: 800; color: #27ae60; margin: 20px 0; padding: 15px; background: #f0fff4; border-radius: 8px; text-align: center; }
        .button-group { display: flex; gap: 15px; justify-content: center; }
        .primary-btn { background: #27ae60; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
        .secondary-btn { background: #f0f0f0; color: #666; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; }
        .summary-card { background: #fff; border: 1px solid #eee; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .note { font-style: italic; color: #888; margin-top: 15px; }
        .text-center { text-align: center; }
        .billing-controls { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; }
        .billing-toggle { display: flex; gap: 8px; }
        .toggle-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #e6e6e6; background: #fff; cursor: pointer; }
        .toggle-btn.active { background: #27ae60; color: white; border-color: #27ae60; }
        .trial-cta { margin-left: auto; }
        .trial-btn { background: linear-gradient(90deg,#ff9a9e,#fecfef); border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; }
        .primary-btn.large { padding: 16px 36px; font-size: 1.05rem; }
      `}</style>
    </div>
  );
};

export default SubscriptionFlow;