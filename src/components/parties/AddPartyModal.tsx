"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Party } from "@/lib/types";

interface AddPartyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (party: Party) => void;
  initialParty?: Party | null; // when set → edit mode
}

export function AddPartyModal({
  open,
  onClose,
  onSave,
  initialParty,
}: AddPartyModalProps) {
  const isEdit = !!initialParty;
  const [partyType, setPartyType] = useState<"c" | "s">("c");
  const [balType, setBalType] = useState<"r" | "g">("r");
  const [tab, setTab] = useState<"cr" | "ad">("cr");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [openingBal, setOpeningBal] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [nameError, setNameError] = useState(false);

  // Pre-fill form when opening in edit mode
  useEffect(() => {
    if (open && initialParty) {
      setName(initialParty.name);
      setPhone(initialParty.ph);
      // const rawAmt = initialParty.amt.replace(/[^0-9.]/g, "");
      setOpeningBal(""); // Don't pre-fill opening balance; let user enter it if they want to change it, otherwise we'll keep the existing amt as-is.
      setBalType(initialParty.g ? "r" : "g");
      setPartyType("c");
      setTab("ad");
      setNameError(false);
      setEmail(initialParty.email ?? "");
      setAddress(initialParty.address ?? "");
      setPanNumber(initialParty.panNumber ?? "");
    } else if (open && !initialParty) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialParty]);

  if (!open) return null;

  function reset() {
    setName("");
    setPhone("");
    setOpeningBal("");
    setNameError(false);
    setEmail("");
    setAddress("");
    setPanNumber("");
    setPartyType("c");
    setBalType("r");
    setTab("cr");
  }

  function buildParty(): Party {
    const words = name.trim().split(" ");
    const init =
      words
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2) || "??";

    if (isEdit && initialParty) {
      // Edit mode: preserve existing transactions and running balance.
      // Only recompute amt if the user explicitly changed the opening balance field
      // from the pre-filled value; otherwise keep the stored amt intact.
      const prefilled = initialParty.amt.replace(/[^0-9.]/g, "");
      const current = openingBal.replace(/[^0-9.]/g, "");
      const amtChanged = current !== prefilled && current !== "";
      const amt = amtChanged
        ? `Rs. ${Math.round(parseFloat(openingBal) || 0).toLocaleString("en-IN")}`
        : initialParty.amt;
      return {
        init,
        name: name.trim(),
        ph: phone.trim(),
        amt,
        g: balType === "r",
        type: partyType,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        panNumber: panNumber.trim() || undefined,
        txns: initialParty.txns,
      };
    }

    // Create mode
    const bal = parseFloat(openingBal) || 0;
    return {
      init,
      name: name.trim(),
      ph: phone.trim(),
      amt: `Rs. ${bal > 0 ? Math.round(bal).toLocaleString("en-IN") : "0"}`,
      g: balType === "r",
      type: partyType,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      txns: [],
    };
  }

  function handleSave() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onSave(buildParty());
    reset();
    onClose();
  }

  function handleSaveAndNew() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onSave(buildParty());
    reset();
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[13px] shadow-2xl w-[640px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <span className="text-[15px] font-bold text-[#1a1a1a]">
            {isEdit ? "Edit Party" : "Add New Party"}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-4 mb-4">
            {/* Photo placeholder */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-[90px] h-[90px] rounded-xl bg-gray-100 flex items-center justify-center">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <circle cx="26" cy="20" r="11" fill="#bbb" />
                  <path
                    d="M4 48c0-12.15 9.85-22 22-22s22 9.85 22 22"
                    fill="#bbb"
                  />
                </svg>
              </div>
              <span className="text-[11.5px] text-[#29ad82] cursor-pointer">
                Upload Photo
              </span>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Full Name*
                </label>
                <input
                  className={`border rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:bg-white ${nameError ? "border-red-400 focus:border-red-400" : "border-[#e5e5e5] focus:border-[#29ad82]"}`}
                  placeholder="Enter the name of party"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(false);
                  }}
                />
                {nameError && (
                  <span className="text-red-500 text-[11px]">
                    Name is required
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Phone Number
                </label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82] focus:bg-white"
                  placeholder="Enter party phone no"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Party Type
                </label>
                <div className="flex gap-2">
                  {(["c", "s"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPartyType(t)}
                      className={`px-4 py-1.5 text-[12.5px] rounded-lg border-[1.5px] font-medium transition-colors ${partyType === t ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#e5e5e5] text-gray-500 bg-white"}`}
                    >
                      {t === "c" ? "Customer" : "Supplier"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#f0f0f0] mb-4">
            {(isEdit ? (["ad"] as const) : (["cr", "ad"] as const)).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${tab === t ? "text-[#29ad82] border-[#29ad82] font-semibold" : "text-gray-400 border-transparent"}`}
              >
                {t === "cr" ? "Credit Info" : "Additional Info"}
              </button>
            ))}
          </div>

          {tab === "cr" && !isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Opening Balance
                </label>
                <div className="flex border border-[#e5e5e5] rounded-lg overflow-hidden focus-within:border-[#29ad82]">
                  <span className="px-3 py-2 bg-[#f7f7f7] text-[12px] text-gray-400 border-r border-[#e5e5e5] font-medium">
                    Rs.
                  </span>
                  <input
                    className="flex-1 px-3 py-2 text-[13px] outline-none bg-white"
                    placeholder="eg. 0"
                    type="number"
                    value={openingBal}
                    onChange={(e) => setOpeningBal(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  As of Date
                </label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none"
                  defaultValue="2083 Bai 25"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Balance Type
                </label>
                <div className="flex gap-2">
                  {(["r", "g"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBalType(t)}
                      className={`px-4 py-1.5 text-[12.5px] rounded-lg border-[1.5px] font-medium transition-colors ${balType === t ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#e5e5e5] text-gray-500 bg-white"}`}
                    >
                      {t === "r" ? "To Receive" : "To Give"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "ad" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Email
                </label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82] focus:bg-white"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  Address
                </label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82] focus:bg-white"
                  placeholder="Enter address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-gray-600 font-medium">
                  PAN Number
                </label>
                <input
                  className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82] focus:bg-white"
                  placeholder="Enter PAN"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#f0f0f0]">
          {!isEdit && (
            <button
              onClick={handleSaveAndNew}
              className="px-4 py-2 text-[13px] border border-[#e5e5e5] rounded-lg hover:bg-gray-50 font-medium"
            >
              Save &amp; New
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 text-[13px] bg-[#29ad82] text-white rounded-lg font-bold hover:bg-[#1d9470] transition-colors"
          >
            {isEdit ? "Update Party" : "Save Party"}
          </button>
        </div>
      </div>
    </div>
  );
}
