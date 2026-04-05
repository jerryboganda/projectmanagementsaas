'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Info,
  Loader2,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  isPopular?: boolean;
  tier: 'free' | 'pro' | 'enterprise';
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for small teams just getting started.',
    tier: 'free',
    isCurrent: true,
    features: [
      'Up to 5 members',
      '3 active projects',
      '1 GB storage',
      'Basic issue tracking',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/member/month',
    description: 'For growing teams that need more power.',
    tier: 'pro',
    isCurrent: false,
    isPopular: true,
    features: [
      'Unlimited members',
      'Unlimited projects',
      '50 GB storage',
      'Advanced analytics',
      'Custom workflows',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with advanced needs.',
    tier: 'enterprise',
    isCurrent: false,
    features: [
      'Everything in Pro',
      'SSO / SAML',
      'Audit logs',
      'Custom contracts',
      'SLA guarantee',
      'Dedicated support',
      'On-premise option',
    ],
  },
];

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    date: 'Mar 01, 2026',
    amount: '$0.00',
    status: 'paid',
    description: 'Free Plan - March 2026',
  },
  {
    id: 'inv-002',
    date: 'Feb 01, 2026',
    amount: '$0.00',
    status: 'paid',
    description: 'Free Plan - February 2026',
  },
  {
    id: 'inv-003',
    date: 'Jan 01, 2026',
    amount: '$0.00',
    status: 'paid',
    description: 'Free Plan - January 2026',
  },
  {
    id: 'inv-004',
    date: 'Dec 01, 2025',
    amount: '$36.00',
    status: 'paid',
    description: 'Pro Plan - December 2025 (3 seats)',
  },
];

function UsageMeter({
  label,
  used,
  total,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
}) {
  const pct = Math.min((used / total) * 100, 100);
  const isWarning = pct >= 80;
  const isCritical = pct >= 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-400">
          {used} / {total} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-border/60">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{Math.round(pct)}% used</p>
    </div>
  );
}

export function BillingPanel() {
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [savingCard, setSavingCard] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setMessage(null);
    setUpgrading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setUpgrading(false);
    setMessage(`Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} initiated — you will be redirected to the billing portal once the Stripe integration is live.`);
  };

  const handleSavePaymentMethod = async () => {
    setSavingCard(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavingCard(false);
    setPaymentModalOpen(false);
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setMessage('Payment method saved (simulated). Stripe integration is pending.');
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Billing &amp; Plans</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your subscription, track usage, and review payment history.
        </p>
      </div>

      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Current Plan */}
      <section className="mb-10 space-y-4">
        <div className="border-b border-neutral-border/60 pb-4">
          <h2 className="text-base font-semibold text-slate-200">Current Plan</h2>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <Star className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-100">Free Plan</p>
              <p className="text-sm text-slate-400">5 members · 3 projects · 1 GB storage</p>
            </div>
          </div>
          <button
            onClick={() => void handleUpgrade('pro')}
            disabled={upgrading}
            className={cn(
              'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
              upgrading && 'cursor-not-allowed opacity-60',
            )}
          >
            {upgrading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {upgrading ? 'Processing...' : 'Upgrade Plan'}
          </button>
        </div>
      </section>

      {/* Usage */}
      <section className="mb-10 space-y-6">
        <div className="border-b border-neutral-border/60 pb-4">
          <h2 className="text-base font-semibold text-slate-200">Usage</h2>
          <p className="mt-1 text-sm text-slate-500">Current billing cycle consumption against plan limits.</p>
        </div>
        <div className="grid gap-6 rounded-xl border border-neutral-border bg-neutral-surface/30 px-6 py-6 md:grid-cols-2">
          <UsageMeter label="Seats" used={3} total={5} unit="seats" />
          <UsageMeter label="Storage" used={0.4} total={1} unit="GB" />
          <UsageMeter label="Active Projects" used={2} total={3} unit="projects" />
          <UsageMeter label="API Calls (this month)" used={120} total={1000} unit="calls" />
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="mb-10 space-y-6">
        <div className="border-b border-neutral-border/60 pb-4">
          <h2 className="text-base font-semibold text-slate-200">Plans</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-xl border px-5 py-5',
                plan.isCurrent
                  ? 'border-primary/40 bg-primary/5'
                  : plan.isPopular
                  ? 'border-violet-500/40 bg-violet-500/5'
                  : 'border-neutral-border bg-neutral-surface/30',
              )}
            >
              {plan.isPopular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              {plan.isCurrent && (
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Check className="size-3" /> Current Plan
                </span>
              )}
              <p className="text-lg font-bold text-slate-100">{plan.name}</p>
              <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-100">{plan.price}</span>
                {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              {!plan.isCurrent && (
                <button
                  onClick={() => void handleUpgrade(plan.id)}
                  disabled={upgrading}
                  className={cn(
                    'w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    plan.tier === 'enterprise'
                      ? 'border-neutral-border bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20',
                    upgrading && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {plan.tier === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Payment Method */}
      <section className="mb-10 space-y-4">
        <div className="border-b border-neutral-border/60 pb-4">
          <h2 className="text-base font-semibold text-slate-200">Payment Method</h2>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-neutral-border bg-neutral-surface/20 px-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <CreditCard className="size-5" />
            <span className="text-sm">No payment method on file — required when upgrading to a paid plan.</span>
          </div>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="rounded-md border border-neutral-border bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            Add Payment Method
          </button>
        </div>
      </section>

      {/* Billing History */}
      <section className="space-y-4">
        <div className="border-b border-neutral-border/60 pb-4">
          <h2 className="text-base font-semibold text-slate-200">Billing History</h2>
        </div>
        {MOCK_INVOICES.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-surface/20 px-6 py-10 text-center">
            <CreditCard className="mx-auto mb-3 size-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No invoices yet</p>
            <p className="mt-1 text-xs text-slate-500">Invoices will appear here once you upgrade to a paid plan.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-border">
            <div className="grid grid-cols-[1fr_140px_120px_100px_60px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Description</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">PDF</span>
            </div>
            {MOCK_INVOICES.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-[1fr_140px_120px_100px_60px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0"
              >
                <span className="text-sm text-slate-300">{invoice.description}</span>
                <span className="text-sm text-slate-400">{invoice.date}</span>
                <span className="text-sm text-slate-300">{invoice.amount}</span>
                <span
                  className={cn(
                    'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : invoice.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-rose-500/10 text-rose-300',
                  )}
                >
                  {invoice.status}
                </span>
                <div className="flex justify-end">
                  <button className="text-slate-500 transition-colors hover:text-slate-300">
                    <Download className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment Method Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setCardNumber('');
          setExpiry('');
          setCvc('');
        }}
        title="Add Payment Method"
        footer={
          <>
            <button
              onClick={() => {
                setPaymentModalOpen(false);
                setCardNumber('');
                setExpiry('');
                setCvc('');
              }}
              className="rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSavePaymentMethod()}
              disabled={savingCard}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                savingCard && 'cursor-not-allowed opacity-60',
              )}
            >
              {savingCard ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {savingCard ? 'Saving...' : 'Save Card'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200">
              Stripe integration pending. This form is a placeholder and will not process real payments.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-300">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="h-8 w-full rounded-sm border border-neutral-border bg-transparent px-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-300">Expiry Date</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM / YY"
                maxLength={7}
                className="h-8 w-full rounded-sm border border-neutral-border bg-transparent px-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-300">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="h-8 w-full rounded-sm border border-neutral-border bg-transparent px-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
