"use client";

import { useState } from "react";
import { Search, Plus, Trash2, Edit2, Info } from "lucide-react";
import type { InventoryItem, CartItem } from "@/lib/types";
import { useInventory } from "@/context/InventoryContext";
import Link from "next/link";

const categories = ["All Categories", "Hoodie", "Trouser", "Shirts", "Kurti", "General", "Fabric", "Accessories"];

function ProductCard({ item, idx, cartItem, onAdd, onChangeQty }: {
  item: InventoryItem;
  idx: number;
  cartItem?: CartItem;
  onAdd: (i: number) => void;
  onChangeQty: (i: number, delta: number) => void;
}) {
  const outOfStock = item.qty === 0 || item.critical;
  const bgColor = (item.color || "#29ad82") + "22";
  const textColor = item.color || "#29ad82";

  return (
    <div className="bg-white rounded-xl p-4 relative border border-[#efefef] hover:shadow-sm transition-shadow">
      <Info size={16} className="absolute top-3 right-3 text-gray-300" />
      <div className="w-16 h-16 rounded-xl mb-3 flex items-center justify-center" style={{ background: bgColor }}>
        <span className="text-[19px] font-bold" style={{ color: textColor }}>{item.init}</span>
      </div>
      <div className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 line-clamp-2 leading-snug min-h-[36px]">{item.name}</div>
      <div className="text-[12.5px] text-gray-500 mb-0.5">
        Qty: <span className={`font-semibold ${outOfStock ? "text-[#d32f2f]" : item.low ? "text-[#e65100]" : "text-gray-700"}`}>{item.qty} PCS</span>
      </div>
      <div className="text-[12.5px] text-gray-500 mb-3.5">{item.sale}/PCS</div>
      {cartItem ? (
        <div className="flex items-center border border-[#29ad82] rounded-lg overflow-hidden">
          <button onClick={() => onChangeQty(idx, -1)} className="flex-1 h-9 flex items-center justify-center text-[17px] text-[#29ad82] bg-[#edfaf4] border-r border-[#e5e5e5]">−</button>
          <span className="flex-1 text-center text-[13.5px] font-bold text-[#29ad82]">{cartItem.qty}</span>
          <button onClick={() => onChangeQty(idx, 1)} className="flex-1 h-9 flex items-center justify-center text-[17px] text-[#29ad82] bg-[#edfaf4] border-l border-[#e5e5e5]">+</button>
        </div>
      ) : (
        <button
          onClick={() => !outOfStock && onAdd(idx)}
          disabled={outOfStock}
          className={`w-full py-2 rounded-lg text-[12.5px] border font-medium transition-colors ${outOfStock ? "border-[#f0f0f0] text-gray-300 bg-[#fafafa] cursor-not-allowed" : "border-[#d0d0d0] text-gray-700 bg-white hover:bg-gray-50"}`}
        >
          {outOfStock ? "Out of Stock" : "Click to Select"}
        </button>
      )}
    </div>
  );
}

export function POSPage() {
  const { items: invItems } = useInventory();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [cart, setCart] = useState<CartItem[]>([]);

  const base = category === "All Categories" ? invItems : invItems.filter((i) => i.cat === category);
  const displayed = search ? base.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())) : base;

  function addToCart(idx: number) {
    const item = invItems[idx];
    if (!item || item.qty === 0 || item.critical) return;
    const price = parseInt((item.sale || "0").replace(/[^0-9]/g, "")) || 0;
    setCart((prev) => {
      const existing = prev.find((c) => c.idx === idx);
      if (existing) return prev.map((c) => c.idx === idx && c.qty < item.qty ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { idx, name: item.name, price, qty: 1, maxQty: item.qty }];
    });
  }

  function changeCartQty(idx: number, delta: number) {
    setCart((prev) => {
      if (delta === -999) return prev.filter((c) => c.idx !== idx);
      return prev.map((c) => {
        if (c.idx !== idx) return c;
        const newQty = c.qty + delta;
        return newQty <= 0 ? null! : { ...c, qty: newQty };
      }).filter(Boolean);
    });
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-5 py-3 bg-white border-b border-[#f0f0f0] flex-shrink-0">
        <h1 className="text-[17px] font-bold text-[#1a1a1a]">Quick POS</h1>
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 max-w-72 flex-1">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder:text-gray-400" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Link href="/inventory/add" className="flex items-center gap-1.5 text-[13px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium">
          <Plus size={14} /> Add New Item
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: product grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category chips */}
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#f0f0f0] overflow-x-auto flex-shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[13px] font-medium border-[1.5px] transition-colors whitespace-nowrap ${category === cat ? "bg-[#29ad82] text-white border-[#29ad82]" : "bg-white text-gray-700 border-[#e0e0e0] hover:border-[#29ad82]"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {displayed.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-[13px]">No items found</div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {displayed.map((item) => {
                  const idx = invItems.indexOf(item);
                  const cartItem = cart.find((c) => c.idx === idx);
                  return (
                    <ProductCard
                      key={item.code}
                      item={item}
                      idx={idx}
                      cartItem={cartItem}
                      onAdd={addToCart}
                      onChangeQty={changeCartQty}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: billing panel */}
        <div className="w-[340px] flex-shrink-0 bg-white border-l border-[#f0f0f0] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0">
            <span className="text-[14px] font-bold text-[#1a1a1a]">Billing Items ({cart.length})</span>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[12.5px] text-[#e53935] font-medium hover:underline">Clear Items</button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="text-[14.5px] font-bold text-gray-500 mb-1.5">No Billing Items</div>
              <div className="text-[12.5px] text-gray-400 text-center">Select items to record a sale</div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {cart.map((c) => (
                  <div key={c.idx} className="p-4 border-b border-[#f5f5f5]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <div className="text-[13.5px] font-semibold text-[#1a1a1a] leading-snug">{c.name}</div>
                        <div className="text-[12.5px] text-gray-500 mt-0.5">{c.qty} PCS × Rs. {c.price.toLocaleString("en-US")}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Edit2 size={15} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                        <Trash2 size={15} className="text-[#ffcdd2] cursor-pointer hover:text-[#e53935]" onClick={() => changeCartQty(c.idx, -999)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-[#e5e5e5] rounded-lg overflow-hidden">
                        <button onClick={() => changeCartQty(c.idx, -1)} className="w-8 h-8 flex items-center justify-center text-gray-600 bg-[#f8f8f8] border-r border-[#e5e5e5] text-[16px]">−</button>
                        <span className="min-w-[36px] text-center text-[13.5px] font-semibold text-[#1a1a1a] px-1">{c.qty}</span>
                        <button onClick={() => changeCartQty(c.idx, 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 bg-[#f8f8f8] border-l border-[#e5e5e5] text-[16px]">+</button>
                      </div>
                      <span className="text-[14px] font-bold text-[#29ad82]">Rs. {(c.price * c.qty).toLocaleString("en-US")}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#f0f0f0] flex-shrink-0">
                <div className="px-4 pt-3.5">
                  <div className="flex justify-between text-[13px] font-medium mb-2.5">
                    <span className="text-gray-600">Sub Total</span>
                    <span className="text-[#1a1a1a]">Rs. {total.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex gap-3.5 mb-3.5">
                    {["+ Discount", "+ Tax", "+ Additional Charges"].map((l) => (
                      <span key={l} className="text-[12.5px] text-[#29ad82] font-medium cursor-pointer hover:underline">{l}</span>
                    ))}
                  </div>
                  <div className="flex justify-between text-[15px] font-bold py-3 border-t border-[#f0f0f0] mb-3.5">
                    <span className="text-[#1a1a1a]">Total Amount</span>
                    <span className="text-[#29ad82]">Rs. {total.toLocaleString("en-US")}</span>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button className="w-full py-3.5 bg-[#29ad82] text-white rounded-xl text-[14px] font-semibold hover:bg-[#1d9470] transition-colors tracking-wide">
                    Continue Billing
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
