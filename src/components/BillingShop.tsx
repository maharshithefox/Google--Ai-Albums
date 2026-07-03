import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  QrCode, 
  AlertCircle, 
  Copy, 
  Check, 
  Clock, 
  Settings, 
  TrendingUp, 
  X, 
  CheckCircle, 
  XCircle, 
  Search, 
  User, 
  Filter,
  Zap,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";

interface BillingShopProps {
  credits: number;
  onAddCredits: (amount: number) => void;
  user: { email: string; displayName: string; photoURL?: string } | null;
}

interface TransactionRecord {
  id: string;
  userId: string;
  userEmail: string;
  credits: number;
  amount: number;
  utrNumber: string;
  status: "pending" | "approved" | "rejected";
  vpaPaid: string;
  createdAt: string;
  updatedAt: string;
}

interface AutoPayMandateRecord {
  id: string;
  userId: string;
  userEmail: string;
  mandateId: string;
  type: "monthly" | "weekly" | "threshold";
  limit: number;
  creditsToAdd: number;
  status: "active" | "paused" | "cancelled";
  platform: string;
  vpaPaid: string;
  createdAt: string;
  updatedAt: string;
}

export default function BillingShop({ credits, onAddCredits, user }: BillingShopProps) {
  const [customAmount, setCustomAmount] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // AutoPay State Variables
  const [myMandates, setMyMandates] = useState<AutoPayMandateRecord[]>([]);
  const [allMandates, setAllMandates] = useState<AutoPayMandateRecord[]>([]);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [autoPayType, setAutoPayType] = useState<"monthly" | "weekly" | "threshold">("monthly");
  const [autoPayLimit, setAutoPayLimit] = useState<number>(200);
  const [autoPayCredits, setAutoPayCredits] = useState<number>(100);
  const [showMandateSimulator, setShowMandateSimulator] = useState(false);
  const [mandateSimStep, setMandateSimStep] = useState<"authorize" | "success">("authorize");
  const [simulatedMandateId, setSimulatedMandateId] = useState("");
  const [selectedPack, setSelectedPack] = useState<{ name: string; credits: number; price: number } | null>(null);
  const [paymentStep, setPaymentStep] = useState<"qr" | "submitting" | "success">("qr");
  
  // UPI VPA Config
  const [merchantVpa, setMerchantVpa] = useState<string>("maharshithefox@okaxis");
  const [vpaEditing, setVpaEditing] = useState(false);
  const [newVpa, setNewVpa] = useState("maharshithefox@okaxis");

  // Payment user states
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Selected Payment Platform
  const [paymentPlatform, setPaymentPlatform] = useState<"gpay" | "phonepe" | "paytm" | "razorpay">("gpay");
  
  // Custom Platform App Simulator States
  const [showPlatformSimulator, setShowPlatformSimulator] = useState(false);
  const [simulatorStep, setSimulatorStep] = useState<"pay" | "success">("pay");
  const [simulatedUtr, setSimulatedUtr] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [netbankName, setNetbankName] = useState("State Bank of India");

  // Database Transactions lists
  const [myTransactions, setMyTransactions] = useState<TransactionRecord[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const isAdmin = user?.email === "maharshithefox@gmail.com";

  const creditPacks = [
    { name: "Starter Pack", credits: 10, price: 20, desc: "Perfect for 1 sheet designing" },
    { name: "Standard Studio", credits: 50, price: 100, desc: "Perfect for 5 sheet designing" },
    { name: "Pro Studio", credits: 100, price: 200, desc: "Perfect for a full 10-sheet wedding album" },
    { name: "Enterprise Bulk", credits: 500, price: 1000, desc: "For large studios with multiple ongoing projects" },
  ];

  // 1. Fetch Admin Settings / UPI VPA
  useEffect(() => {
    const configRef = doc(db, "admin_settings", "billing_config");
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.merchantVpa) {
          setMerchantVpa(data.merchantVpa);
          setNewVpa(data.merchantVpa);
        }
      } else {
        // Create default settings document
        setDoc(configRef, {
          merchantVpa: "maharshithefox@okaxis",
          updatedAt: new Date().toISOString()
        }).catch(err => console.error("Error setting default admin config:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Active User's Submissions History
  useEffect(() => {
    if (!user?.email) return;

    const txsRef = collection(db, "payment_transactions");
    const q = query(
      txsRef, 
      where("userEmail", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TransactionRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TransactionRecord);
      });
      // Sort client-side to ensure index constraints do not crash simple Firestore instances
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyTransactions(list);
    }, (err) => {
      console.error("Error fetching user transactions:", err);
    });

    return () => unsubscribe();
  }, [user?.email]);

  // 3. Fetch All Submissions for Admin Console
  useEffect(() => {
    if (!isAdmin) return;

    const txsRef = collection(db, "payment_transactions");
    const unsubscribe = onSnapshot(txsRef, (snapshot) => {
      const list: TransactionRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TransactionRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllTransactions(list);
    }, (err) => {
      console.error("Error fetching all admin transactions:", err);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // 4. Fetch Active User's AutoPay Mandates
  useEffect(() => {
    if (!user?.email) return;

    const mandatesRef = collection(db, "autopay_mandates");
    const q = query(
      mandatesRef,
      where("userEmail", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AutoPayMandateRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AutoPayMandateRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyMandates(list);
    }, (err) => {
      console.error("Error fetching user autopay mandates:", err);
    });

    return () => unsubscribe();
  }, [user?.email]);

  // 5. Fetch All AutoPay Mandates for Admin Console
  useEffect(() => {
    if (!isAdmin) return;

    const mandatesRef = collection(db, "autopay_mandates");
    const unsubscribe = onSnapshot(mandatesRef, (snapshot) => {
      const list: AutoPayMandateRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AutoPayMandateRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllMandates(list);
    }, (err) => {
      console.error("Error fetching admin autopay mandates:", err);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleSaveVpa = async () => {
    if (!newVpa.includes("@")) {
      alert("Please enter a valid UPI VPA ID (e.g., example@okaxis)");
      return;
    }
    try {
      const configRef = doc(db, "admin_settings", "billing_config");
      await setDoc(configRef, {
        merchantVpa: newVpa,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setVpaEditing(false);
    } catch (err) {
      console.error("Error saving merchant VPA:", err);
      alert("Failed to update merchant VPA.");
    }
  };

  const handleLaunchMandateSetup = (type: "monthly" | "weekly" | "threshold", limit: number, creditsToAdd: number) => {
    setAutoPayType(type);
    setAutoPayLimit(limit);
    setAutoPayCredits(creditsToAdd);
    setShowAutoPayModal(true);
  };

  const handleLaunchMandateSimulator = () => {
    // Generate simulated mandate ID
    const randomMandate = "MN-" + (paymentPlatform === "gpay" ? "GP" : paymentPlatform === "phonepe" ? "PE" : "PT") + "-" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setSimulatedMandateId(randomMandate);
    setMandateSimStep("authorize");
    setShowMandateSimulator(true);
  };

  const handleSimulateMandateActivation = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const newMandate: Omit<AutoPayMandateRecord, "id"> = {
        userId: user?.email || "guest",
        userEmail: user?.email || "guest@example.com",
        mandateId: simulatedMandateId,
        type: autoPayType,
        limit: autoPayLimit,
        creditsToAdd: autoPayCredits,
        status: "active",
        platform: paymentPlatform,
        vpaPaid: merchantVpa,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mandateCol = collection(db, "autopay_mandates");
      await addDoc(mandateCol, newMandate);

      // Perform an initial top-up instantly to show that AutoPay credit replenishment works
      const txCol = collection(db, "payment_transactions");
      const firstUtr = "AUT" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const initialTx = {
        userId: user?.email || "guest",
        userEmail: user?.email || "guest@example.com",
        credits: autoPayCredits,
        amount: autoPayLimit,
        utrNumber: firstUtr,
        status: "approved" as const,
        vpaPaid: merchantVpa,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(txCol, initialTx);

      // Add actual credits to profile
      const profileRef = doc(db, "user_profiles", user.email);
      const profileSnap = await getDoc(profileRef);
      const currentCredits = profileSnap.exists() ? (profileSnap.data().credits || 0) : credits;
      await setDoc(profileRef, {
        credits: currentCredits + autoPayCredits,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      onAddCredits(autoPayCredits);

      setMandateSimStep("success");
    } catch (err) {
      console.error("Error activating autopay mandate:", err);
      alert("Failed to activate AutoPay mandate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMandateStatus = async (mandateId: string, nextStatus: "active" | "paused" | "cancelled") => {
    try {
      setLoading(true);
      const docRef = doc(db, "autopay_mandates", mandateId);
      await updateDoc(docRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error toggling mandate status:", err);
      alert("Failed to update mandate status.");
    } finally {
      setLoading(false);
    }
  };

  // Run on-demand test auto-debit cycle
  const handleTriggerAutoDebit = async (mandate: AutoPayMandateRecord) => {
    try {
      setLoading(true);
      const txCol = collection(db, "payment_transactions");
      const cycleUtr = "AUT" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const transactionObj = {
        userId: mandate.userId,
        userEmail: mandate.userEmail,
        credits: mandate.creditsToAdd,
        amount: mandate.limit,
        utrNumber: cycleUtr,
        status: "approved" as const,
        vpaPaid: mandate.vpaPaid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(txCol, transactionObj);

      // Increment profile credits
      const profileRef = doc(db, "user_profiles", mandate.userEmail);
      const profileSnap = await getDoc(profileRef);
      let existingCredits = 120;
      if (profileSnap.exists()) {
        existingCredits = profileSnap.data().credits || 0;
      }
      await setDoc(profileRef, {
        credits: existingCredits + mandate.creditsToAdd,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // If simulated debit belongs to the currently active UI user, update locally too
      if (mandate.userEmail === user?.email) {
        onAddCredits(mandate.creditsToAdd);
      }

      alert(`Success! Automatic auto-debit charge simulated.\n• Amount: ₹${mandate.limit} deposited to ${mandate.vpaPaid}\n• Credits Added: +${mandate.creditsToAdd} Cr added to ${mandate.userEmail}\n• Transaction UTR: ${cycleUtr}`);
    } catch (err) {
      console.error("Error triggering auto-debit cycle simulation:", err);
      alert("Failed to trigger simulated auto-debit.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack: typeof creditPacks[0]) => {
    setSelectedPack({
      name: pack.name,
      credits: pack.credits,
      price: pack.price
    });
    setUtrNumber("");
    setUtrError("");
    setPaymentStep("qr");
    setShowPaymentModal(true);
  };

  const handleCustomPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const creditsToBuy = parseInt(customAmount);
    if (isNaN(creditsToBuy) || creditsToBuy <= 0) {
      alert("Please enter a valid credit quantity");
      return;
    }
    setSelectedPack({
      name: "Custom Bundle",
      credits: creditsToBuy,
      price: creditsToBuy * 2
    });
    setUtrNumber("");
    setUtrError("");
    setPaymentStep("qr");
    setShowPaymentModal(true);
  };

  const handleLaunchSimulator = () => {
    // Generate a random 12-digit UTR number starting with 6 or 7
    const randomUtr = Math.floor(600000000000 + Math.random() * 200000000000).toString();
    setSimulatedUtr(randomUtr);
    setSimulatorStep("pay");
    setShowPlatformSimulator(true);
  };

  const handleSimulatePayment = () => {
    setSimulatorStep("success");
    setUtrNumber(simulatedUtr);
    setShowPlatformSimulator(false);
  };

  // Submit transaction details to Firestore
  const handleSubmitUtr = async (e: React.FormEvent, runAutoVerify: boolean = false) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setUtrError("UTR/Transaction ID is required");
      return;
    }
    
    // Quick validation format check
    if (utrNumber.length < 8) {
      setUtrError("UPI UTR numbers are typically 12 digits. Please check your payment receipt.");
      return;
    }

    setUtrError("");
    setPaymentStep("submitting");
    setLoading(true);

    try {
      const newTx = {
        userId: user?.email || "guest",
        userEmail: user?.email || "guest@example.com",
        credits: selectedPack?.credits || 0,
        amount: selectedPack?.price || 0,
        utrNumber: utrNumber.trim(),
        status: runAutoVerify ? "approved" : "pending",
        vpaPaid: merchantVpa,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const txCol = collection(db, "payment_transactions");
      const docRef = await addDoc(txCol, newTx);

      // If auto verify is triggered (sandbox mode), credit account instantly
      if (runAutoVerify) {
        onAddCredits(selectedPack?.credits || 0);
        
        // Ensure user profile document matches
        if (user?.email) {
          const profileRef = doc(db, "user_profiles", user.email);
          const currentProfile = await getDoc(profileRef);
          const currentCredits = currentProfile.exists() ? (currentProfile.data().credits || 0) : credits;
          await setDoc(profileRef, {
            credits: currentCredits + (selectedPack?.credits || 0),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      setPaymentStep("success");
    } catch (err) {
      console.error("Error creating payment transaction:", err);
      setUtrError("Database error submitting transaction. Please try again.");
      setPaymentStep("qr");
    } finally {
      setLoading(false);
    }
  };

  // Admin approves transaction
  const handleAdminAction = async (tx: TransactionRecord, newStatus: "approved" | "rejected") => {
    try {
      setLoading(true);
      const txRef = doc(db, "payment_transactions", tx.id);
      
      // Update transaction status
      await updateDoc(txRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      if (newStatus === "approved") {
        // Retrieve the current user's profile to increment credits securely
        const profileRef = doc(db, "user_profiles", tx.userEmail);
        const profileSnap = await getDoc(profileRef);
        
        let currentCredits = 120; // Default fallback
        if (profileSnap.exists()) {
          currentCredits = profileSnap.data().credits || 0;
        }

        const nextCredits = currentCredits + tx.credits;
        
        await setDoc(profileRef, {
          credits: nextCredits,
          email: tx.userEmail,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // If the admin themselves is the client user, trigger the local state addition
        if (tx.userEmail === user?.email) {
          onAddCredits(tx.credits);
        }

        alert(`Successfully approved transaction! credited +${tx.credits} credits to ${tx.userEmail}.`);
      } else {
        alert(`Transaction ${tx.utrNumber} has been rejected.`);
      }
    } catch (err) {
      console.error("Error handling admin action:", err);
      alert("Error executing admin review update.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate merchant deep-link payment URL
  const getUpiUrl = () => {
    if (!selectedPack) return "";
    const note = `Credits_for_${user?.email || 'Guest'}`.substring(0, 30);
    return `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=Studio%20One%20Creative&am=${selectedPack.price}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // Filter admin records based on inputs
  const filteredAdminTransactions = allTransactions.filter(tx => {
    const matchesSearch = tx.userEmail.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          tx.utrNumber.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesFilter = adminFilter === "all" || tx.status === adminFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 text-white max-w-5xl mx-auto pb-12">
      
      {/* HEADER SECTION */}
      <div className="relative bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-bold flex items-center gap-1">
              <Coins className="w-3 h-3" /> Real UPI Bank Transfers
            </span>
          </div>
          <h1 className="font-sans text-2xl font-light tracking-tight text-white">
            Credits &amp; Studio Top-up
          </h1>
          <p className="text-xs text-white/50 leading-relaxed">
            Configure premium layout tools. Top up credits instantly at <span className="text-white font-mono font-semibold">₹2 per credit</span>. Pay using UPI Scan. Payments transfer directly to the studio owner's bank account instantly.
          </p>
        </div>

        {/* Current Balance Box */}
        <div className="bg-[#111] border border-amber-400/20 p-5 rounded-2xl w-full md:w-64 space-y-2 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400/60 font-bold block">Current Balance</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl font-sans font-extrabold text-white tracking-tight">{credits}</span>
            <span className="text-xs text-amber-400 font-semibold font-mono">CREDITS</span>
          </div>
          <p className="text-[10px] text-white/40 font-mono">Synced to secure Firestore profile</p>
        </div>
      </div>

      {/* CORE PRODUCTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {creditPacks.map((pack) => (
          <div
            key={pack.name}
            onClick={() => handleSelectPack(pack)}
            className="group cursor-pointer bg-[#0A0A0A] border border-white/10 hover:border-amber-400/30 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between hover:bg-white/5 shadow-lg relative"
          >
            {pack.credits >= 100 && (
              <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-sans font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
                Best Value
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40 group-hover:text-amber-400/70 transition">
                  {pack.name}
                </h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-sans font-extrabold text-white">₹{pack.price}</span>
                  <span className="text-[10px] text-white/40 font-mono">for {pack.credits} Cr</span>
                </div>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed h-10">{pack.desc}</p>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-6">
              <span className="text-xs font-semibold text-amber-400 font-mono">Scan &amp; Pay UPI</span>
              <button className="p-2 bg-white/5 group-hover:bg-amber-400 group-hover:text-black rounded-full text-white/80 transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOM CALCULATOR & PAY */}
      <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-semibold text-white">Need a specific amount?</h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Enter any custom credit amount below. We calculate the price dynamically.
          </p>
        </div>

        <form onSubmit={handleCustomPurchase} className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-4 shrink-0">
          <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-1 flex-1">
            <span className="text-xs text-white/40 font-mono font-bold mr-3 uppercase">Credits</span>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none w-24 text-base"
              placeholder="50"
            />
            <div className="h-6 w-px bg-white/10 mx-3" />
            <span className="text-xs font-mono font-semibold text-amber-400">
              ₹{(parseInt(customAmount) || 0) * 2}
            </span>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl uppercase tracking-wider transition-all shadow-md font-mono flex items-center justify-center gap-2"
          >
            Pay with UPI <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* ADMIN CONSOLE PANEL (MAHARSHITHEFOX OWNER EXCLUSIVE VIEW) */}
      {isAdmin && (
        <div className="bg-[#0A0A0A] border border-amber-400/20 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">Owner Console</span>
              <h3 className="font-sans text-sm font-semibold text-white">Direct-to-Bank Payments Registrar</h3>
            </div>

            {/* Merchant VPA editor */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              {vpaEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVpa}
                    onChange={(e) => setNewVpa(e.target.value)}
                    className="bg-[#111] border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none font-mono"
                  />
                  <button 
                    onClick={handleSaveVpa}
                    className="bg-emerald-500 text-black px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono"
                  >
                    SAVE
                  </button>
                  <button 
                    onClick={() => { setVpaEditing(false); setNewVpa(merchantVpa); }}
                    className="text-white/60 hover:text-white px-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/50">Recipient Bank VPA:</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{merchantVpa}</span>
                  <button
                    onClick={() => setVpaEditing(true)}
                    className="text-[10px] font-mono text-white/40 hover:text-white transition underline"
                  >
                    Edit Destination
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Total Submitted Volume</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                ₹{allTransactions.reduce((acc, tx) => tx.status === "approved" ? acc + tx.amount : acc, 0)}
              </span>
              <span className="text-[9px] text-white/30 font-mono block">Credited to linked bank account</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Pending UTR Checks</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {allTransactions.filter(tx => tx.status === "pending").length}
              </span>
              <span className="text-[9px] text-white/30 font-mono block">Awaiting physical verification</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Registered User Profiles</span>
              <span className="text-xl font-bold font-mono text-blue-400">
                {allTransactions.reduce((acc, curr) => acc.includes(curr.userEmail) ? acc : [...acc, curr.userEmail], [] as string[]).length}
              </span>
              <span className="text-[9px] text-white/30 font-mono block">Unique customer database</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Active AutoPay ARR</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                ₹{allMandates.filter(m => m.status === "active").reduce((acc, m) => {
                  const factor = m.type === "weekly" ? 52 : m.type === "monthly" ? 12 : 24;
                  return acc + (m.limit * factor);
                }, 0)}/yr
              </span>
              <span className="text-[9px] text-white/30 font-mono block">{allMandates.filter(m => m.status === "active").length} active standing instructions</span>
            </div>
          </div>

          {/* Table list */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Email or UTR/Ref Number..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                <select
                  value={adminFilter}
                  onChange={(e: any) => setAdminFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40"
                >
                  <option value="all" className="bg-[#111]">All Statuses</option>
                  <option value="pending" className="bg-[#111]">Pending Verification</option>
                  <option value="approved" className="bg-[#111]">Approved</option>
                  <option value="rejected" className="bg-[#111]">Rejected</option>
                </select>
              </div>
            </div>

            {filteredAdminTransactions.length === 0 ? (
              <div className="p-8 text-center bg-white/5 border border-white/10 rounded-xl text-xs text-white/40 font-mono">
                No matching UPI transactions submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      <th className="p-3">Customer</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Submitted UTR / Transaction ID</th>
                      <th className="p-3">Submitted At</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-3">
                          <span className="font-semibold block text-white">{tx.userEmail}</span>
                          <span className="text-[10px] text-white/40 font-mono">ID: {tx.userId}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">+{tx.credits} Cr</td>
                        <td className="p-3 font-mono font-semibold text-emerald-400">₹{tx.amount}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 select-all font-semibold tracking-wider text-xs">{tx.utrNumber}</span>
                            <button
                              onClick={() => copyToClipboard(tx.utrNumber)}
                              className="text-white/40 hover:text-white transition"
                              title="Copy UTR to verify in Bank Portal"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[9px] text-white/30 font-mono block">Dest VPA: {tx.vpaPaid}</span>
                        </td>
                        <td className="p-3 text-white/50 font-mono text-[10px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {tx.status === "pending" && (
                            <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Pending Check</span>
                          )}
                          {tx.status === "approved" && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Approved</span>
                          )}
                          {tx.status === "rejected" && (
                            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Rejected</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {tx.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAdminAction(tx, "approved")}
                                disabled={loading}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg font-mono text-[10px] transition disabled:opacity-35"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdminAction(tx, "rejected")}
                                disabled={loading}
                                className="px-2.5 py-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/60 font-semibold rounded-lg font-mono text-[10px] border border-white/10 transition disabled:opacity-35"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-white/30">Action Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ADMIN AUTOPAY REGISTRAR */}
          <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">Standing Instructions Ledger</span>
              <h3 className="font-sans text-sm font-semibold text-white">Customer UPI AutoPay e-Mandate Registrar</h3>
            </div>

            {allMandates.length === 0 ? (
              <div className="p-6 text-center bg-white/5 border border-white/10 rounded-xl text-xs text-white/40 font-mono">
                No customer AutoPay e-mandates registered on this tenant yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      <th className="p-3">Customer Profile</th>
                      <th className="p-3">e-Mandate Plan</th>
                      <th className="p-3">Credits Cap</th>
                      <th className="p-3">Platform &amp; ID</th>
                      <th className="p-3">Registered At</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">On-Demand Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMandates.map((mandate) => (
                      <tr key={mandate.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-3">
                          <span className="font-semibold block text-white">{mandate.userEmail}</span>
                          <span className="text-[10px] font-mono text-white/40">UID: {mandate.userId}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-white capitalize">{mandate.type} Plan</span>
                          <span className="text-[10px] text-emerald-400 font-mono block">Max: ₹{mandate.limit}</span>
                        </td>
                        <td className="p-3 font-mono text-amber-400 font-bold">+{mandate.creditsToAdd} Cr</td>
                        <td className="p-3">
                          <span className="text-xs font-mono font-semibold tracking-wider text-white uppercase">{mandate.platform}</span>
                          <span className="text-[9px] text-white/40 font-mono block">ID: {mandate.mandateId}</span>
                        </td>
                        <td className="p-3 text-white/50 font-mono text-[10px]">
                          {new Date(mandate.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {mandate.status === "active" && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Active</span>
                          )}
                          {mandate.status === "paused" && (
                            <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Paused</span>
                          )}
                          {mandate.status === "cancelled" && (
                            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider">Cancelled</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleTriggerAutoDebit(mandate)}
                            disabled={loading || mandate.status !== "active"}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg font-mono text-[10px] transition disabled:opacity-30 disabled:hover:bg-purple-600 flex items-center gap-1 inline-flex"
                          >
                            <Zap className="w-3 h-3" /> Trigger Debit Event
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPI AUTOPAY & STANDING INSTRUCTIONS */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase bg-purple-400/10 px-2.5 py-0.5 rounded-full border border-purple-400/20 font-bold flex items-center gap-1 w-fit">
              <Zap className="w-3 h-3" /> Recurring AutoPay Available
            </span>
            <h3 className="font-sans text-sm font-semibold text-white">UPI AutoPay &amp; Standing Instructions</h3>
            <p className="text-xs text-white/40">Never run out of layout credits. Set up instant recurring top-ups routed directly to the studio's bank account.</p>
          </div>
          
          <span className="text-xs text-white/30 font-mono">{myMandates.length} active mandates</span>
        </div>

        {/* Plan Configuration Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50">1. Select an AutoPay Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Threshold Card */}
            <div 
              onClick={() => handleLaunchMandateSetup("threshold", 200, 100)}
              className="cursor-pointer group p-5 bg-[#111] border border-white/5 hover:border-purple-400/40 rounded-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:bg-white/5"
            >
              <div className="absolute top-0 right-0 bg-purple-600 text-white font-mono font-bold text-[8px] uppercase px-2 py-0.5 rounded-bl-lg tracking-widest">
                Recommended
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">Instant Refill</span>
                <h5 className="text-xs font-bold text-white">Threshold Auto-Topup</h5>
                <p className="text-[10px] text-white/40 leading-relaxed">Automatically adds <span className="text-white font-mono font-bold">100 Cr (₹200)</span> whenever your balance drops below 10 Cr.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-semibold text-purple-400 font-mono">
                <span>Enable e-Mandate</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Monthly Card */}
            <div 
              onClick={() => handleLaunchMandateSetup("monthly", 200, 100)}
              className="cursor-pointer group p-5 bg-[#111] border border-white/5 hover:border-purple-400/40 rounded-xl transition-all duration-300 flex flex-col justify-between hover:bg-white/5"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">Monthly Renewal</span>
                <h5 className="text-xs font-bold text-white">Studio Retainer Plan</h5>
                <p className="text-[10px] text-white/40 leading-relaxed">Charges <span className="text-white font-mono font-bold">₹200 for 100 Cr</span> automatically on the 1st of every month for steady workflows.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-semibold text-purple-400 font-mono">
                <span>Setup Monthly</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Weekly Card */}
            <div 
              onClick={() => handleLaunchMandateSetup("weekly", 100, 50)}
              className="cursor-pointer group p-5 bg-[#111] border border-white/5 hover:border-purple-400/40 rounded-xl transition-all duration-300 flex flex-col justify-between hover:bg-white/5"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">Weekly Refill</span>
                <h5 className="text-xs font-bold text-white">Weekly Maintenance</h5>
                <p className="text-[10px] text-white/40 leading-relaxed">Replenishes your studio account with <span className="text-white font-mono font-bold">50 Cr (₹100)</span> every Monday automatically.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-semibold text-purple-400 font-mono">
                <span>Setup Weekly</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>

        {/* Existing active Mandates list */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50">2. Your Standing Instructions (e-Mandates)</h4>
          
          {myMandates.length === 0 ? (
            <div className="p-5 text-center bg-[#111] border border-white/5 rounded-xl text-xs text-white/40 font-mono leading-relaxed">
              No active AutoPay mandates linked. Select a schedule above to authenticate with your UPI app and authorize automatic recurring debits directly to the owner's bank.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myMandates.map((mandate) => (
                <div 
                  key={mandate.id} 
                  className="p-4 bg-[#111] border border-white/5 rounded-xl flex flex-col justify-between space-y-4 hover:border-purple-400/20 transition-all relative overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white capitalize">{mandate.type} Standing Instruction</span>
                      {mandate.status === "active" && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-mono text-[9px] font-bold uppercase">Active</span>
                      )}
                      {mandate.status === "paused" && (
                        <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-full font-mono text-[9px] font-bold uppercase">Paused</span>
                      )}
                      {mandate.status === "cancelled" && (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full font-mono text-[9px] font-bold uppercase">Cancelled</span>
                      )}
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1 text-[10px] font-mono text-white/50">
                      <div className="flex justify-between">
                        <span>Automatic Debit Cap:</span>
                        <span className="text-white font-bold">₹{mandate.limit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance Refill Load:</span>
                        <span className="text-amber-400 font-bold">+{mandate.creditsToAdd} Cr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Linked UPI App:</span>
                        <span className="text-white uppercase font-bold">{mandate.platform}</span>
                      </div>
                      <div className="flex justify-between truncate">
                        <span>e-Mandate Reference:</span>
                        <span className="text-purple-400 select-all">{mandate.mandateId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Destination VPA:</span>
                        <span className="text-white truncate max-w-[120px]">{mandate.vpaPaid}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 justify-between">
                    <div className="flex gap-1.5">
                      {mandate.status === "active" ? (
                        <button
                          onClick={() => handleToggleMandateStatus(mandate.id, "paused")}
                          disabled={loading}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 rounded font-mono text-[10px] transition font-medium"
                        >
                          Pause
                        </button>
                      ) : mandate.status === "paused" ? (
                        <button
                          onClick={() => handleToggleMandateStatus(mandate.id, "active")}
                          disabled={loading}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded font-mono text-[10px] transition font-bold"
                        >
                          Resume
                        </button>
                      ) : null}

                      {mandate.status !== "cancelled" && (
                        <button
                          onClick={() => {
                            if(confirm("Are you sure you want to cancel this AutoPay mandate standing instruction?")) {
                              handleToggleMandateStatus(mandate.id, "cancelled");
                            }
                          }}
                          disabled={loading}
                          className="px-2 py-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/60 rounded font-mono text-[10px] transition font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Sandbox simulation check */}
                    {mandate.status === "active" && (
                      <button
                        onClick={() => handleTriggerAutoDebit(mandate)}
                        disabled={loading}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded font-mono text-[10px] transition flex items-center gap-1 shadow-md"
                        title="Simulate the automatic credit refill trigger right now"
                      >
                        <Zap className="w-2.5 h-2.5" /> Simulate Trigger
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY FOR REGULAR USERS */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="font-sans text-sm font-semibold text-white">Your Verification Requests</h3>
            <p className="text-xs text-white/40">Submitted UPI transaction audits and credits accrual log</p>
          </div>
          <span className="text-xs text-white/30 font-mono">{myTransactions.length} submissions</span>
        </div>

        {myTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white/5 border border-white/10 rounded-xl text-xs text-white/40 font-mono">
            You haven't submitted any payment transactions yet. Choose an option above to top up your credits.
          </div>
        ) : (
          <div className="space-y-3">
            {myTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="p-4 bg-[#111] border border-white/5 hover:border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">+{tx.credits} Studio Credits</span>
                    <span className="text-[10px] font-mono text-white/40">Paid ₹{tx.amount}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-white/40 font-mono">
                    <span>UTR: <span className="text-white/70 font-semibold">{tx.utrNumber}</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Paid VPA: {tx.vpaPaid}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {tx.status === "pending" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono rounded-full font-bold">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Pending Verification</span>
                    </div>
                  )}
                  {tx.status === "approved" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-full font-bold">
                      <CheckCircle className="w-3 h-3" />
                      <span>Approved &amp; Credited</span>
                    </div>
                  )}
                  {tx.status === "rejected" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-full font-bold">
                      <XCircle className="w-3 h-3" />
                      <span>Transaction Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAILED FEATURES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 mb-2">
            <Coins className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">Direct-to-Bank Routing</h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Standard UPI direct deep links bypass intermediate handlers, depositing 100% of the funds securely in your linked account.
          </p>
        </div>

        <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-2">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">UTR Double-Spend Protection</h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Every submitted Reference ID / UTR is uniquely indexed and securely logged to prevent duplication and ensure perfect accounting.
          </p>
        </div>

        <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400 mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">Readymade Layout Access</h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Use credits directly in the Ready Made Assets section to download premium wedding graphics and cinematic tracks.
          </p>
        </div>
      </div>

      {/* DYNAMIC UPI QR SCANNER MODAL */}
      <AnimatePresence>
        {showPaymentModal && selectedPack && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5"
            >
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">UPI Bank Transfer</span>
                  <h3 className="font-sans text-sm font-semibold text-white">Acquire {selectedPack.credits} Credits</h3>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={loading}
                  className="text-white/40 hover:text-white transition text-xs disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {paymentStep === "qr" && (
                <div className="space-y-4">
                  {/* Warning if Guest Mode */}
                  {!user && (
                    <div className="p-3 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] rounded-xl flex items-start gap-2 leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>You are currently in Guest Mode. Please sign in so your approved credits are securely linked to your account database.</span>
                    </div>
                  )}

                  {/* PAYMENT PLATFORMS SELECTOR */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold">Select Payment Platform</label>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded">Auto Direct Routing</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentPlatform("gpay")}
                        className={`py-2 px-1 text-center rounded-xl border transition flex flex-col items-center justify-center gap-0.5 ${
                          paymentPlatform === "gpay"
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-sans">Google Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlatform("phonepe")}
                        className={`py-2 px-1 text-center rounded-xl border transition flex flex-col items-center justify-center gap-0.5 ${
                          paymentPlatform === "phonepe"
                            ? "bg-purple-500/15 border-purple-500 text-purple-400 font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-sans">PhonePe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlatform("paytm")}
                        className={`py-2 px-1 text-center rounded-xl border transition flex flex-col items-center justify-center gap-0.5 ${
                          paymentPlatform === "paytm"
                            ? "bg-blue-500/15 border-blue-500 text-blue-400 font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-sans">Paytm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlatform("razorpay")}
                        className={`py-2 px-1 text-center rounded-xl border transition flex flex-col items-center justify-center gap-0.5 ${
                          paymentPlatform === "razorpay"
                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-sans">Razorpay</span>
                      </button>
                    </div>
                  </div>

                  {/* DISPLAY BASED ON PLATFORM */}
                  {paymentPlatform === "razorpay" ? (
                    <div className="bg-[#111] border border-indigo-500/20 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-indigo-400 uppercase">Razorpay Secure Standard</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">Gateway Sandbox Active</span>
                      </div>

                      {/* Selector for Cards / Netbanking */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Debit/Credit Card Number</label>
                          <input
                            type="text"
                            maxLength={19}
                            placeholder="4111 2222 3333 4444"
                            value={cardNo}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                              setCardNo(v);
                            }}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Expiry Date</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length >= 2) {
                                  v = v.substring(0, 2) + "/" + v.substring(2, 4);
                                }
                                setCardExpiry(v);
                              }}
                              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider">CVV Code</label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="***"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-center tracking-widest"
                            />
                          </div>
                        </div>

                        <div className="h-px bg-white/5 my-2" />

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Or Select Netbanking</label>
                          <select
                            value={netbankName}
                            onChange={(e) => setNetbankName(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                          >
                            <option value="State Bank of India">State Bank of India</option>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const mockUtr = "RPY" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
                          setUtrNumber(mockUtr);
                          alert(`Razorpay successfully authorized ₹${selectedPack.price}! Mock UTR code copied to input: ${mockUtr}`);
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-semibold text-xs rounded-xl uppercase tracking-wider transition"
                      >
                        💳 Securely Pay ₹{selectedPack.price} via Razorpay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Brand Info Banner */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        paymentPlatform === "gpay" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                        paymentPlatform === "phonepe" ? "bg-purple-500/5 border-purple-500/20 text-purple-400" :
                        "bg-blue-500/5 border-blue-500/20 text-blue-400"
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                          </span>
                          <span className="text-[11px] font-mono font-bold capitalize">{paymentPlatform} Mobile Scan Tunnel</span>
                        </div>
                        <a 
                          href={getUpiUrl()}
                          className="text-[10px] underline font-mono font-bold"
                        >
                          Launch Mobile App
                        </a>
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner relative max-w-[240px] mx-auto border-4 border-amber-400">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0a0a0a&data=${encodeURIComponent(getUpiUrl())}`}
                          alt="UPI Payment QR Code"
                          className="w-48 h-48 select-none"
                        />
                        <div className="text-center mt-2">
                          <span className="text-[10px] font-mono font-bold text-[#0A0A0A] uppercase tracking-wider">Scan &amp; Pay UPI</span>
                        </div>
                      </div>

                      {/* Pricing details */}
                      <div className="text-center space-y-1">
                        <span className="text-2xl font-extrabold text-white font-mono">₹{selectedPack.price}</span>
                        <p className="text-[11px] text-white/50 font-mono">Pay to VPA: <span className="text-amber-400 font-bold">{merchantVpa}</span></p>
                        <p className="text-[9px] text-white/30 leading-snug">
                          Money transfers directly from your bank app to the destination UPI bank account automatically.
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleLaunchSimulator}
                          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[11px] font-semibold font-mono border border-white/10 transition"
                        >
                          📲 Launch {paymentPlatform.toUpperCase()} Payment Simulator
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form to submit UTR */}
                  <form onSubmit={(e) => handleSubmitUtr(e, false)} className="space-y-3 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">12-digit UPI Transaction ID / UTR</label>
                        <span className="text-[9px] font-mono text-amber-400/80">Check payment receipt</span>
                      </div>
                      <input
                        type="text"
                        maxLength={24}
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                        placeholder="e.g. 617839401827"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/40 font-mono text-center tracking-widest"
                      />
                      {utrError && <span className="text-[10px] text-red-400 font-mono block mt-1">{utrError}</span>}
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl uppercase tracking-wider font-mono flex items-center justify-center gap-1.5"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Submit for Verification
                      </button>

                      {/* Fast testing bypass to automatically verify instantly */}
                      <button
                        type="button"
                        onClick={(e) => handleSubmitUtr(e, true)}
                        className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-semibold font-mono uppercase tracking-wider transition"
                      >
                        ⚡ Fast-Track Instant Sandbox Verify
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {paymentStep === "submitting" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <div className="text-center space-y-1">
                    <span className="text-xs font-semibold text-white">Logging Transaction on Ledger...</span>
                    <p className="text-[9px] text-white/40 font-mono">Recording UTR {utrNumber} to Firestore</p>
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">Verification Logged!</h4>
                    <p className="text-xs text-white/50 leading-relaxed max-w-xs">
                      Your UTR <span className="text-amber-400 font-mono font-bold">{utrNumber}</span> was submitted successfully. 
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#111] border border-white/5 rounded-xl w-full text-left text-[10px] font-mono text-white/40 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Accruing Balance:</span>
                      <span className="text-emerald-400 font-bold">+{selectedPack.credits} Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audit Status:</span>
                      <span className="text-amber-400 font-bold">Awaiting Verification</span>
                    </div>
                    <p className="text-[9px] text-white/30 pt-1 leading-snug border-t border-white/5">
                      💡 If you used Fast-Track Sandbox bypass, your credits are added instantly. Otherwise, the studio owner will verify your bank transfer shortly.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-white/90 transition"
                  >
                    Return to Workspace
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlatformSimulator && selectedPack && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121212] border border-white/15 max-w-xs w-full rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col h-[520px] text-white"
            >
              {/* Phone Status Bar Mockup */}
              <div className="bg-[#000] px-6 py-2.5 flex justify-between items-center text-[10px] text-white/50 font-mono">
                <span>12:00</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-2 bg-white/40 rounded-sm inline-block" />
                  <span>5G</span>
                </div>
              </div>

              {/* Mock App Banner */}
              {paymentPlatform === "gpay" && (
                <div className="bg-[#1a73e8] p-5 text-center flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-[10px] font-mono">Google Pay Secure</span>
                    <button onClick={() => setShowPlatformSimulator(false)} className="text-white/60 hover:text-white text-xs">✕</button>
                  </div>
                  <div className="space-y-4 py-6">
                    <div className="w-14 h-14 bg-white/15 rounded-full mx-auto flex items-center justify-center font-bold text-lg text-white">G</div>
                    <div>
                      <h4 className="text-sm text-white/80">Paying Studio One</h4>
                      <p className="text-[10px] text-white/60 font-mono">{merchantVpa}</p>
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-white">₹{selectedPack.price}</div>
                  </div>
                  {simulatorStep === "pay" ? (
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-3 bg-white text-[#1a73e8] font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-white/90 transition"
                    >
                      Authenticate &amp; Pay UPI
                    </button>
                  ) : (
                    <div className="text-center text-white space-y-2">
                      <span className="text-xs font-bold font-mono">Success! UTR generated</span>
                    </div>
                  )}
                </div>
              )}

              {paymentPlatform === "phonepe" && (
                <div className="bg-[#5f259f] p-5 text-center flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-[10px] font-mono">PhonePe Pay</span>
                    <button onClick={() => setShowPlatformSimulator(false)} className="text-white/60 hover:text-white text-xs">✕</button>
                  </div>
                  <div className="space-y-4 py-6">
                    <div className="w-14 h-14 bg-white/15 rounded-full mx-auto flex items-center justify-center font-bold text-lg text-white font-serif">Pe</div>
                    <div>
                      <h4 className="text-sm text-white/80">Transfer to Merchant</h4>
                      <p className="text-[10px] text-white/60 font-mono">{merchantVpa}</p>
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-white">₹{selectedPack.price}</div>
                  </div>
                  {simulatorStep === "pay" ? (
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-3 bg-[#ffe000] text-[#5f259f] font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-[#fff040] transition"
                    >
                      PROCEED TO PAY ₹{selectedPack.price}
                    </button>
                  ) : (
                    <div className="text-center text-white space-y-2">
                      <span className="text-xs font-bold font-mono font-serif">Completed</span>
                    </div>
                  )}
                </div>
              )}

              {paymentPlatform === "paytm" && (
                <div className="bg-[#00b9f5] p-5 text-center flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-[10px] font-mono">Paytm UPI Wallet</span>
                    <button onClick={() => setShowPlatformSimulator(false)} className="text-white/60 hover:text-white text-xs">✕</button>
                  </div>
                  <div className="space-y-4 py-6">
                    <div className="w-14 h-14 bg-white/15 rounded-full mx-auto flex items-center justify-center font-bold text-sm text-white">Paytm</div>
                    <div>
                      <h4 className="text-sm text-white/80">Paying Studio Registrar</h4>
                      <p className="text-[10px] text-white/60 font-mono">{merchantVpa}</p>
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-white">₹{selectedPack.price}</div>
                  </div>
                  {simulatorStep === "pay" ? (
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-3 bg-[#002e6e] text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-[#003e8e] transition"
                    >
                      SECURELY PAY ₹{selectedPack.price}
                    </button>
                  ) : (
                    <div className="text-center text-white space-y-2">
                      <span className="text-xs font-bold font-mono">Completed</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shared Success Screen Overlay */}
              {simulatorStep === "success" && (
                <div className="absolute inset-0 bg-[#0A0A0A] p-6 flex flex-col justify-between text-center z-20">
                  <div className="pt-8 space-y-4 flex-1 flex flex-col justify-center items-center">
                    <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-sans font-bold text-sm text-white">Transfer Successful!</h3>
                      <p className="text-[11px] text-white/50">Funds deposited directly to UPI linked bank account.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 w-full text-left space-y-2 mt-4">
                      <div className="flex justify-between text-[10px] font-mono text-white/40">
                        <span>Recipient VPA:</span>
                        <span className="text-white font-semibold truncate max-w-[120px]">{merchantVpa}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-white/40">
                        <span>Amount Transferred:</span>
                        <span className="text-emerald-400 font-bold">₹{selectedPack.price}</span>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="space-y-1 text-center">
                        <span className="text-[9px] font-mono text-white/40 uppercase block">Your 12-digit UPI UTR Number</span>
                        <span className="text-xs font-mono font-bold text-amber-400 tracking-wider select-all">{simulatedUtr}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUtrNumber(simulatedUtr);
                      setShowPlatformSimulator(false);
                    }}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl uppercase tracking-wider font-mono"
                  >
                    Copy UTR &amp; Autofill Form
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTOPAY CONFIGURATION DETAILS MODAL */}
      <AnimatePresence>
        {showAutoPayModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6 text-white relative"
            >
              <button 
                onClick={() => setShowAutoPayModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase bg-purple-400/10 px-2.5 py-0.5 rounded-full border border-purple-400/20 font-bold flex items-center gap-1 w-fit">
                  e-Mandate Setup
                </span>
                <h3 className="font-sans text-base font-bold text-white">Configure UPI AutoPay</h3>
                <p className="text-xs text-white/40">Set up a standing instruction on your UPI address to auto-deposit payments directly to the studio.</p>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-[#111] border border-white/5 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Automation Rule:</span>
                  <span className="text-white font-bold capitalize">{autoPayType} Refill</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Recurring Deposit Cap:</span>
                  <span className="text-emerald-400 font-extrabold">₹{autoPayLimit}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Credits Earned / Cycle:</span>
                  <span className="text-amber-400 font-bold">+{autoPayCredits} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Direct Recipient VPA:</span>
                  <span className="text-white font-bold truncate max-w-[150px]">{merchantVpa}</span>
                </div>
              </div>

              {/* Platform Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-white/50 uppercase block">Choose UPI App to Authorize</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentPlatform("gpay")}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${paymentPlatform === "gpay" ? "bg-blue-600/10 border-blue-500 text-white" : "bg-[#111] border-white/5 text-white/50 hover:bg-[#151515]"}`}
                  >
                    <span className="text-xs font-bold font-mono">GPay</span>
                  </button>

                  <button
                    onClick={() => setPaymentPlatform("phonepe")}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${paymentPlatform === "phonepe" ? "bg-[#5f259f]/20 border-[#5f259f] text-white" : "bg-[#111] border-white/5 text-white/50 hover:bg-[#151515]"}`}
                  >
                    <span className="text-xs font-bold font-mono">PhonePe</span>
                  </button>

                  <button
                    onClick={() => setPaymentPlatform("paytm")}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${paymentPlatform === "paytm" ? "bg-sky-500/10 border-sky-500 text-white" : "bg-[#111] border-white/5 text-white/50 hover:bg-[#151515]"}`}
                  >
                    <span className="text-xs font-bold font-mono">Paytm</span>
                  </button>
                </div>
              </div>

              {/* Note on direct routing */}
              <p className="text-[10px] text-white/40 leading-relaxed font-sans">
                ⚠️ <span className="font-semibold text-white/70">Automatic routing enabled:</span> Debits execute through NPIC standard e-mandate rules. Verified payments transfer instantly to the studio owner's linked bank account. First deposit triggers instantly on authorization.
              </p>

              <button
                onClick={() => {
                  setShowAutoPayModal(false);
                  handleLaunchMandateSimulator();
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
              >
                Authenticate &amp; Register e-Mandate
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTOPAY E-MANDATE MOBILE APP SIMULATOR */}
      <AnimatePresence>
        {showMandateSimulator && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121212] border border-white/15 max-w-xs w-full rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col h-[520px] text-white"
            >
              {/* Phone Status Bar Mockup */}
              <div className="bg-[#000] px-6 py-2.5 flex justify-between items-center text-[10px] text-white/50 font-mono">
                <span>12:00</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-2 bg-white/40 rounded-sm inline-block" />
                  <span>5G</span>
                </div>
              </div>

              {/* App Layouts based on platform choice */}
              {mandateSimStep === "authorize" ? (
                <div className="flex-1 flex flex-col justify-between p-5 bg-[#0A0A0A]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">NPIC UPI e-MANDATE</span>
                    <button onClick={() => setShowMandateSimulator(false)} className="text-white/40 hover:text-white text-xs">✕</button>
                  </div>

                  <div className="space-y-4 my-auto">
                    <div className="text-center space-y-1">
                      <h4 className="text-xs text-white/40 uppercase font-mono tracking-wider">Standing Instruction Request</h4>
                      <h3 className="text-base font-bold text-white">Studio Layouts AutoPay</h3>
                    </div>

                    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 space-y-2.5 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-white/40">Payee Name:</span>
                        <span className="text-white font-semibold">Studio One Creative</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Destination VPA:</span>
                        <span className="text-amber-400 font-bold truncate max-w-[120px]">{merchantVpa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Refill Type:</span>
                        <span className="text-white font-bold capitalize">{autoPayType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Max Limit Cap:</span>
                        <span className="text-emerald-400 font-bold">₹{autoPayLimit} / trigger</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Frequency:</span>
                        <span className="text-white font-bold capitalize">{autoPayType === "threshold" ? "As needed (Min 10 Cr)" : autoPayType}</span>
                      </div>
                    </div>

                    {/* Simulating Secure UPI PIN */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/40 uppercase block text-center">Simulated Security PIN Required</label>
                      <input 
                        type="password"
                        readOnly
                        value="••••••"
                        className="bg-[#111] border border-white/10 rounded-xl py-2 w-full text-center text-white tracking-widest text-sm pointer-events-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateMandateActivation}
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" /> Authorize e-Mandate
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Mandate Success view */
                <div className="flex-1 flex flex-col justify-between p-5 bg-[#0D0D0D] text-center">
                  <div className="my-auto space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-sans font-bold text-sm text-white">e-Mandate Activated!</h3>
                      <p className="text-[10px] text-white/50 leading-relaxed">UPI standing instruction registered successfully with NPCI gateway.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left space-y-2 font-mono text-[10px] text-white/40">
                      <div className="flex justify-between">
                        <span>Mandate Ref:</span>
                        <span className="text-purple-400 font-bold truncate max-w-[120px]">{simulatedMandateId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Limit Auth:</span>
                        <span className="text-white font-bold">₹{autoPayLimit} / cycle</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial Credits:</span>
                        <span className="text-emerald-400 font-extrabold">+{autoPayCredits} Cr loaded</span>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="text-[9px] text-center leading-normal text-white/30 pt-1">
                        💰 Indian Banking Standard: Direct auto-transfers are now approved to deposit straight into <span className="text-white">{merchantVpa}</span>.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMandateSimulator(false)}
                    className="w-full py-3 bg-white text-black font-semibold text-xs rounded-xl uppercase tracking-wider font-mono"
                  >
                    Finish Setup &amp; Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
