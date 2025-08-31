import React, { useEffect, useMemo, useState } from "react";

/* ===================== Utilities ===================== */
const toFixed = (n) => (Math.round(n * 100) / 100).toFixed(2);
const OZ_TO_ML = 29.5735;
const ozToMl = (oz) => oz * OZ_TO_ML;
const ozToL = (oz) => ozToMl(oz) / 1000;
const ozToQt = (oz) => oz / 32;
const ozToGal = (oz) => oz / 128;

const fmt = {
  oz: (n) => `${toFixed(n)} oz`,
  ml: (n) => `${toFixed(ozToMl(n))} mL`,
  l: (n) => `${toFixed(ozToL(n))} L`,
  qt: (n) => `${toFixed(ozToQt(n))} qt`,
  gal: (n) => `${toFixed(ozToGal(n))} gal`,
};

// Unit helpers for New Drink Builder
const UNITS = ["oz", "mL", "L", "qt", "gal"];
function toOz(value, unit) {
  const v = Number(value) || 0;
  switch (unit) {
    case "oz":
      return v;
    case "mL":
      return v / OZ_TO_ML;
    case "L":
      return (v * 1000) / OZ_TO_ML;
    case "qt":
      return v * 32;
    case "gal":
      return v * 128;
    default:
      return v;
  }
}
function fromOz(oz, unit) {
  switch (unit) {
    case "oz":
      return oz;
    case "mL":
      return ozToMl(oz);
    case "L":
      return ozToL(oz);
    case "qt":
      return ozToQt(oz);
    case "gal":
      return ozToGal(oz);
    default:
      return oz;
  }
}

function uid() {
  return Math.random().toString(36).slice(2);
}
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}
function ensureUniqueId(existing, baseId) {
  let id = baseId || "drink";
  let i = 1;
  const set = new Set(existing.map((r) => r.id));
  while (set.has(id)) id = `${baseId}-${i++}`;
  return id;
}

/* ===================== Mix Catalog ===================== */
const MIX_SUFFIX = " (see mix)";
const MIXES_INIT = {
  // Base foam & flavor foams
  "Base Foam": [
    { name: "Heavy Cream", part: 64 },
    { name: "Sugar", part: 28.4 },
  ],
  "Banana Fosters Foam": [
    { name: "Base Foam", part: 96 },
    { name: "Banana Extract", part: 0.17 },
  ],
  "Mauna Kea Foam": [
    { name: "Base Foam", part: 96 },
    { name: "Caramel", part: 3.53 },
    { name: "Hawaiian Salt", part: 0.17 },
  ],
  "Cheesecake Foam": [
    { name: "Base Foam", part: 96 },
    { name: "Cheesecake Extract", part: 0.085 },
  ],
  "Pandan Foam": [
    { name: "Base Foam", part: 96 },
    { name: "Pandan Extract", part: 0.17 },
  ],
  // Creamers
  "Tiki Chata Creamer": [
    { name: "Horchata Mix", part: 1 },
    { name: "Coconut Milk", part: 2 },
  ],
  "Ube Creamer Mix": [
    { name: "Horchata Mix", part: 32 },
    { name: "Coconut Milk", part: 64 },
    { name: "Ube Concentrate", part: 1 },
  ],
  "Dirty Ube Creamer": [
    { name: "Horchata Mix", part: 32 },
    { name: "Coconut Milk", part: 64 },
    { name: "Ube Concentrate", part: 1 },
  ],
  // Lemonade base (your real ratio): 1 part Lemonade mix, 1 part Water
  "Lemonade base": [
    { name: "Lemonade mix", part: 1 },
    { name: "Water", part: 1 },
  ],
};

/* ===================== Recipes ===================== */
const RECIPES_INIT = [
  // Coffee drinks
  {
    id: "tiki-chata",
    label: "Tiki Chata",
    sizes: {
      "12oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 8 },
        { name: "Vanilla syrup", oz: 0.5 },
        { name: "Tiki Chata Creamer (see mix)", oz: 3 },
      ],
      "7oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 4 },
        { name: "Vanilla syrup", oz: 0.25 },
        { name: "Tiki Chata Creamer (see mix)", oz: 1.75 },
      ],
    },
  },
  {
    id: "dirty-ube",
    label: "Dirty Ube",
    sizes: {
      "12oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 8 },
        { name: "Coconut syrup", oz: 0.5 },
        { name: "Dirty Ube Creamer (see mix)", oz: 3 },
      ],
      "7oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 4 },
        { name: "Coconut syrup", oz: 0.25 },
        { name: "Dirty Ube Creamer (see mix)", oz: 1.75 },
      ],
    },
  },
  {
    id: "green-panda",
    label: "Green Panda",
    sizes: {
      "12oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 8 },
        { name: "Coconut syrup", oz: 0.5 },
        { name: "Pandan Foam (see mix)", oz: 3 },
      ],
      "7oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 7 },
        { name: "Coconut syrup", oz: 0.25 },
        { name: "Pandan Foam (see mix)", oz: 3 },
      ],
    },
  },
  {
    id: "mauna-kea",
    label: "Mauna Kea",
    sizes: {
        "12oz": [
          { name: "Cold Brew Coffee (concentrate + water)", oz: 8 },
          { name: "Caramel syrup", oz: 0.5 },
          { name: "Mauna Kea Foam (see mix)", oz: 3 },
        ],
        "7oz": [
          { name: "Cold Brew Coffee (concentrate + water)", oz: 4 },
          { name: "Caramel Syrup", oz: 0.25 },
          { name: "Mauna Kea Foam (see mix)", oz: 1.75 },
        ],
    },
  },
  {
    id: "banana-fosters",
    label: "Banana Fosters",
    sizes: {
      "12oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 8 },
        { name: "Caramel syrup", oz: 0.5 },
        { name: "Banana Fosters Foam (see mix)", oz: 3 },
      ],
    },
  },
  {
	 
    id: "ube-cheesecake",
    label: "Ube Cheesecake",
    sizes: {
      
      "16oz": [
        { name: "Oat Milk", oz: 10 },
        { name: "Cheesecake syrup", oz: 0.75 },
        { name: "Cheesecake Foam (see mix)", oz: 4 },
      ],
	  
	  
	  "7oz": [
        { name: "Oat Milk", oz: 4 },
        { name: "Cheesecake syrup", oz: 0.25 },
        { name: "Cheesecake Foam (see mix)", oz: 1 },
      ],  
	  
    },
  },
  {
    id: "dirty-ube-cheesecake",
    label: "Dirty Ube Cheesecake",
    sizes: {

      "16oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 12 },
        { name: "Coconut syrup", oz: 0.75 },
        { name: "Cheesecake Foam (see mix)", oz: 4 },
      ],
	        "7oz": [
        { name: "Cold Brew Coffee (concentrate + water)", oz: 4 },
        { name: "Coconut syrup", oz: 0.25 },
        { name: "Cheesecake Foam (see mix)", oz: 1 },
      ],
    },
  },

  // Lemonades (24oz)
  {
    id: "lemonade",
    label: "Lemonade",
    sizes: {
      "24oz": [
        { name: "Lemonade base (see mix)", oz: 13 },
        { name: "Ice", oz: 10 },
      ],
    },
  },
  {
    id: "mango-lemonade",
    label: "Mango Lemonade",
    sizes: {
      "24oz": [
        { name: "Lemonade base (see mix)", oz: 13 },
        { name: "Mango puree syrup", oz: 1 },
        { name: "Ice", oz: 10 },
      ],
    },
  },
  {
    id: "strawberry-lemonade",
    label: "Strawberry Lemonade",
    sizes: {
      "24oz": [
        { name: "Lemonade base (see mix)", oz: 13 },
        { name: "Strawberry puree syrup", oz: 1 },
        { name: "Ice", oz: 10 },
      ],
    },
  },
];

/* ===================== Mix expand helpers ===================== */

/* ===================== Just Added for highlight Rules =========================================== */
// Highlight rules: ingredient -> which unit(s) to bold
const highlightRules = {
  "Coconut Milk": ["oz"],                                // bold Coconut Milk oz
  "Cold Brew Coffee (concentrate + water)": ["gal"],     // bold Cold Brew Coffee gal
   "Horchata Mix": ["oz"],     // Horchata Mix oz
   "Heavy Cream": ["qt"],     // bold Heavy Cream qt
   "Mauna Kea Foam (see mix)": ["qt"],     // bold Mauna Kea Foam (see mix) qt
   "Lemonade base (see mix)": ["gal"],     // bold Lemonade base (see mix) gal
	"Tiki Chata Creamer (see mix)": ["oz"],     // bold Lemonade base (see mix) oz
	"Cheesecake Foam (see mix)": ["qt"],     // bold Mauna Kea Foam (see mix) qt
	"Pandan Foam (see mix)": ["qt"],     // bold Mauna Kea Foam (see mix) qt
	"Dirty Ube Creamer (see mix)": ["qt"],     // bold Mauna Kea Foam (see mix) qt

  
};

// Helper: check if a given ingredient/unit should be highlighted
function isHighlighted(name, unit) {
  return highlightRules[name]?.includes(unit);
}


/* ===================== End  Just Added for highlight Rules ====================================== */

function normName(s) {
  return (s || "").trim();
}
function getMixKeyFromIngredientName(name) {
  const idx = name.indexOf(MIX_SUFFIX);
  return idx >= 0 ? name.slice(0, idx) : name;
}
function isMix(name, mixes) {
  return !!mixes[getMixKeyFromIngredientName(normName(name))];
}
function expandToRaw(name, oz, mixes, outMap, stack = new Set()) {
  const mixKey = getMixKeyFromIngredientName(normName(name));
  const def = mixes[mixKey];
  if (!def || !Array.isArray(def) || def.length === 0) {
    const key = normName(name);
    outMap.set(key, (outMap.get(key) || 0) + oz);
    return;
  }
  if (stack.has(mixKey)) {
    // cycle guard: treat mix as raw to avoid infinite loop
    const key = normName(name);
    outMap.set(key, (outMap.get(key) || 0) + oz);
    return;
  }
  stack.add(mixKey);
  const sum = def.reduce((a, b) => a + (Number(b.part) || 0), 0) || 1;
  for (const p of def) {
    const frac = (Number(p.part) || 0) / sum;
    expandToRaw(p.name, oz * frac, mixes, outMap, stack);
  }
  stack.delete(mixKey);
}

/* ===================== Ingredient options ===================== */
function collectIngredientOptions(recipes, mixes, extra) {
  const set = new Set();
  for (const r of recipes) {
    for (const sizeKey of Object.keys(r.sizes || {})) {
      for (const it of r.sizes[sizeKey] || []) if (it?.name) set.add(normName(it.name));
    }
  }
  for (const mixName of Object.keys(mixes || {})) set.add(normName(mixName) + MIX_SUFFIX);
  for (const mixName of Object.keys(mixes || {}))
    for (const part of mixes[mixName] || []) if (part?.name) set.add(normName(part.name));
  for (const c of extra || []) set.add(normName(c));
  const arr = Array.from(set);
  if (arr.length === 0) arr.push("Ingredient");
  return arr.sort((a, b) => a.localeCompare(b));
}

/* ===================== App ===================== */
const RECIPES_LS_KEY = "drinkcalc_recipes_v10";

export default function App() {
  // recipes are persisted in localStorage so your changes survive refresh
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem(RECIPES_LS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return RECIPES_INIT;
  });
  useEffect(() => {
    try {
      localStorage.setItem(RECIPES_LS_KEY, JSON.stringify(recipes));
    } catch {}
  }, [recipes]);

  const [mixes] = useState(MIXES_INIT);
  const [rows, setRows] = useState(
    RECIPES_INIT.length
      ? [
          {
            id: uid(),
            recipeId: RECIPES_INIT[0].id,
            size: Object.keys(RECIPES_INIT[0].sizes)[0],
            qty: 1,
          },
        ]
      : []
  );
  const [extraIngredients, setExtraIngredients] = useState([]);
  const ingredientOptions = useMemo(
    () => collectIngredientOptions(recipes, mixes, extraIngredients),
    [recipes, mixes, extraIngredients]
  );

  const [showMixNamesInRaw, setShowMixNamesInRaw] = useState(true);

  // New Drink state
  const [newLabel, setNewLabel] = useState("");
  const [newSizeKey, setNewSizeKey] = useState("12oz");
  const [newItems, setNewItems] = useState([
    { name: "Cold Brew Coffee (concentrate + water)", oz: 12, unit: "oz" },
  ]);

  const resetNewDrink = () => {
    setNewLabel("");
    setNewSizeKey("12oz");
    setNewItems([{ name: ingredientOptions[0] || "Ingredient", oz: 0, unit: "oz" }]);
  };
  const templateColdBrew = () => {
    if (!newLabel) setNewLabel("Cold Brew");
    setNewSizeKey("12oz");
    setNewItems([{ name: "Cold Brew Coffee (concentrate + water)", oz: 12, unit: "oz" }]);
  };
  const templateFoamDrink = () => {
    if (!newLabel) setNewLabel("Foam Drink");
    setNewSizeKey("12oz");
    setNewItems([{ name: "Base Foam (see mix)", oz: 3, unit: "oz" }]);
  };

  const createNewDrink = () => {
    const label = (newLabel || "").trim();
    if (!label) return alert("Enter a drink name");
    const cleaned = newItems
      .map((it) => ({ name: normName(it.name), oz: Number(it.oz) || 0 }))
      .filter((it) => it.name);
    const baseId = slugify(label);
    const id = ensureUniqueId(recipes, baseId);
    const rec = { id, label, sizes: { [newSizeKey || "12oz"]: cleaned } };
    setRecipes((prev) => [...prev, rec]);
    setRows((rs) => [...rs, { id: uid(), recipeId: id, size: newSizeKey || "12oz", qty: 1 }]);
    resetNewDrink();
  };

  const addCustomIngredient = () => {
    const name = normName(window.prompt("Custom ingredient name?") || "");
    if (!name) return;
    setExtraIngredients((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setNewItems((arr) => [...arr, { name, oz: 0, unit: "oz" }]);
  };

  const resetRecipesToDefaults = () => {
    if (!window.confirm("Reset to default recipes? This clears your saved changes.")) return;
    try {
      localStorage.removeItem(RECIPES_LS_KEY);
    } catch {}
    setRecipes(RECIPES_INIT);
  };

  // Quick Add
  const addAllLemonades = () => {
    const ids = ["lemonade", "mango-lemonade", "strawberry-lemonade"];
    setRows((rs) => {
      const next = [...rs];
      ids.forEach((id) => {
        const rec = recipes.find((r) => r.id === id);
        if (rec) next.push({ id: uid(), recipeId: id, size: Object.keys(rec.sizes)[0], qty: 1 });
      });
      return next;
    });
  };

const addCoreCoffee = () => {
    const ids = ["dirty-ube", "mauna-kea", "ube-cheesecake", "dirty-ube-cheesecake"];
    setRows((rs) => {
      const next = [...rs];
      ids.forEach((id) => {
        const rec = recipes.find((r) => r.id === id);
        if (rec) next.push({ id: uid(), recipeId: id, size: Object.keys(rec.sizes)[0], qty: 1 });
      });
      return next;
    });
  };

  // Totals
  const { grandRaw, grandAsAdded } = useMemo(() => {
    const grandRaw = new Map();
    const grandAsAdded = new Map();
    for (const row of rows) {
      const recipe = recipes.find((r) => r.id === row.recipeId);
      if (!recipe) continue;
      const list = recipe.sizes[row.size] || [];
      for (const ing of list) {
        const name = normName(ing.name);
        const oz = (Number(ing.oz) || 0) * (row.qty || 0);
        // as-added
        grandAsAdded.set(name, (grandAsAdded.get(name) || 0) + oz);
        // include mix name in raw (optional)
        if (showMixNamesInRaw && isMix(name, mixes)) {
          const mixName = getMixKeyFromIngredientName(name) + MIX_SUFFIX;
          const mixKey = normName(mixName);
          grandRaw.set(mixKey, (grandRaw.get(mixKey) || 0) + oz);
        }
        // expand to raw ingredients
        expandToRaw(name, oz, mixes, grandRaw);
      }
    }
    return { grandRaw, grandAsAdded };
  }, [rows, recipes, mixes, showMixNamesInRaw]);

  const toList = (m) =>
    Array.from(m.entries())
      .map(([name, oz]) => ({
        name,
        oz,
        ml: ozToMl(oz),
        l: ozToL(oz),
        qt: ozToQt(oz),
        gal: ozToGal(oz),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const rawList = toList(grandRaw);
  const addedList = toList(grandAsAdded);

  // Diagnostics for lemonade 1:1 split
  const lemonAdded = grandAsAdded.get("Lemonade base (see mix)") || 0;
  const lemonadeMixRaw = grandRaw.get("Lemonade mix") || 0;
  const waterRaw = grandRaw.get("Water") || 0;

  /* ===================== UI ===================== */
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drink Calculator</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMixNamesInRaw}
              onChange={(e) => setShowMixNamesInRaw(e.target.checked)}
            />
            Show mix names in Raw
          </label>
          <button
            className="border rounded px-3 py-1 text-red-600 hover:bg-red-50"
            onClick={resetRecipesToDefaults}
          >
            Reset to Defaults
          </button>
        </div>
      </header>

      {/* New Drink Builder */}
      <section className="border p-4 bg-white rounded-xl shadow-sm">
        <h2 className="font-semibold mb-2">Add New Drink</h2>

        {/* Top controls */}
        <div className="flex gap-2 mb-2 items-center flex-wrap">
          <input
            className="border rounded px-2 py-1 flex-1 min-w-[220px]"
            placeholder="Drink name"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-24"
            placeholder="Size"
            value={newSizeKey}
            onChange={(e) => setNewSizeKey(e.target.value)}
          />
          <button className="border rounded px-3 py-1 hover:bg-gray-50" onClick={templateColdBrew}>
            Template: Cold Brew
          </button>
          <button className="border rounded px-3 py-1 hover:bg-gray-50" onClick={templateFoamDrink}>
            Template: Foam Drink
          </button>
          <button className="border rounded px-3 py-1" onClick={resetNewDrink}>
            Reset
          </button>
          <button className="border rounded px-3 py-1 bg-emerald-50" onClick={createNewDrink}>
            Create
          </button>
        </div>

        {/* Ingredient rows for new drink */}
        {newItems.map((it, idx) => {
          const unit = it.unit || "oz";
          const displayVal = fromOz(it.oz || 0, unit);
          return (
            <div key={idx} className="flex gap-2 mb-1 items-center flex-wrap">
              <select
                className="border rounded px-2 py-1 flex-1 min-w-[220px]"
                value={it.name}
                onChange={(e) =>
                  setNewItems((arr) =>
                    arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                  )
                }
              >
                {ingredientOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {/* amount + unit */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  className="border rounded px-2 py-1 w-28 text-right"
                  value={Number.isFinite(displayVal) ? displayVal : 0}
                  onChange={(e) => {
                    const newVal = parseFloat(e.target.value || "0") || 0;
                    setNewItems((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, oz: toOz(newVal, unit) } : x))
                    );
                  }}
                />
                <select
                  className="border rounded px-2 py-1"
                  value={unit}
                  onChange={(e) => {
                    const nextUnit = e.target.value;
                    // keep internal oz the same; only change display unit
                    setNewItems((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, unit: nextUnit } : x))
                    );
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="border rounded px-2"
                onClick={() => setNewItems((arr) => arr.filter((_, i) => i !== idx))}
              >
                Remove
              </button>
            </div>
          );
        })}

        {/* Add ingredient controls */}
        <div className="flex gap-2 mt-2">
          <button
            className="border rounded px-2"
            onClick={() =>
              setNewItems((arr) => [
                ...arr,
                { name: ingredientOptions[0] || "Ingredient", oz: 0, unit: "oz" },
              ])
            }
          >
            + Add Ingredient
          </button>
          <button className="border rounded px-2" onClick={addCustomIngredient}>
            + Custom Ingredient
          </button>
        </div>
      </section>

      {/* Quick Add */}
		 
	  <section className="border p-4 bg-white rounded-xl shadow-sm">
  <h2 className="font-semibold mb-2">Quick Add</h2>

  <div className="flex gap-2 flex-wrap">
   <button
      className="border rounded px-3 py-1 bg-emerald-50 hover:bg-emerald-100"
      onClick={() => addCoreCoffee()}
    >
      + Add Core Coffee (qty 1 each)
    </button>
	
    <button
      className="border rounded px-3 py-1 bg-yellow-50 hover:bg-yellow-100"
      onClick={() => addAllLemonades()}
    >
      + Add All Lemonades (qty 1 each)
    </button>
   
  </div>
</section>


      {/* Batch Rows */}
      <section className="border p-4 bg-white rounded-xl shadow-sm">
        <h2 className="font-semibold mb-2">Batch Rows</h2>
        <button
          className="border rounded px-2 mb-2"
          onClick={() =>
            recipes.length &&
            setRows((rs) => [
              ...rs,
              {
                id: uid(),
                recipeId: recipes[0].id,
                size: Object.keys(recipes[0].sizes)[0],
                qty: 1,
              },
            ])
          }
        >
          + Add Row
        </button>
        {rows.map((row) => {
          const r = recipes.find((x) => x.id === row.recipeId) || recipes[0];
          const sizes = Object.keys(r?.sizes || {});
          return (
            <div key={row.id} className="flex gap-2 mb-1 items-center">
			
		
		
		
		
			  
			  <select
  className="border rounded px-2 py-1"
  value={row.recipeId}
  onChange={(e) => {
    const newId = e.target.value;
    const rec = recipes.find((r) => r.id === newId);
    const firstSize = rec ? Object.keys(rec.sizes)[0] : row.size;
    setRows((rs) =>
      rs.map((x) =>
        x.id === row.id
          ? { ...x, recipeId: newId, size: firstSize } // update recipeId and reset size
          : x
      )
    );
  }}
>
  {recipes.map((opt) => (
    <option key={opt.id} value={opt.id}>
      {opt.label}
    </option>
  ))}
</select>

			  
 
              <select
                className="border rounded px-2 py-1"
                value={row.size}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) => (x.id === row.id ? { ...x, size: e.target.value } : x))
                  )
                }
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="border rounded px-2 py-1 w-24 text-right"
                min={0}
                value={row.qty}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((x) =>
                      x.id === row.id ? { ...x, qty: parseInt(e.target.value || "0", 10) } : x
                    )
                  )
                }
              />
              <button
                className="border rounded px-2"
                onClick={() => setRows((rs) => rs.filter((x) => x.id !== row.id))}
              >
                Remove
              </button>
            </div>
          );
        })}
      </section>
  
     

      {/* Mix & Item Totals (as added) */}
      <section className="border p-4 bg-white rounded-xl shadow-sm">
        <h2 className="font-semibold mb-2">Mix & Item Totals (as added)</h2>
        {addedList.length === 0 && <div className="text-sm text-gray-500">No rows yet.</div>}
        <div className="grid grid-cols-6 text-xs font-semibold border-b py-2">
          <div>Ingredient/Mix</div>
          <div className="text-right">oz</div>
          <div className="text-right">L</div>
          <div className="text-right">mL</div>
          <div className="text-right">qt</div>
          <div className="text-right">gal</div>
        </div>
        {addedList.map((g, i) => (
          <div key={i} className="grid grid-cols-6 text-sm py-1 border-b">
            <div>{g.name}</div>
            <div className="text-right">{fmt.oz(g.oz)}</div>
            <div className="text-right">{fmt.l(g.oz)}</div>
            <div className="text-right">{fmt.ml(g.oz)}</div>
            <div className="text-right">{fmt.qt(g.oz)}</div>
            <div className="text-right">{fmt.gal(g.oz)}</div>
          </div>
        ))}
      </section> 
	 

	 
	

      {/* Raw Ingredients Needed */}
	  
      <section className="border p-4 bg-white rounded-xl shadow-sm">
        <h2 className="font-semibold mb-2">Raw Ingredients Needed</h2>
        {rawList.length === 0 && <div className="text-sm text-gray-500">No rows yet.</div>}
        <div className="grid grid-cols-6 text-xs font-semibold border-b py-2">
          <div>Raw Ingredient</div>
          <div className="text-right">oz</div>
          <div className="text-right">L</div>
          <div className="text-right">mL</div>
          <div className="text-right">qt</div>
          <div className="text-right">gal</div>
        </div>
					
	{rawList.map((g, i) => (
  <div key={i} className="grid grid-cols-6 text-sm py-1 border-b">
    <div>{g.name}</div>
    <div className={`text-right ${isHighlighted(g.name, "oz") ? "font-bold bg-yellow-200" : ""}`}>
      {fmt.oz(g.oz)}
    </div>
    <div className={`text-right ${isHighlighted(g.name, "l") ? "font-bold bg-yellow-200" : ""}`}>
      {fmt.l(g.oz)}
    </div>
    <div className={`text-right ${isHighlighted(g.name, "ml") ? "font-bold bg-yellow-200" : ""}`}>
      {fmt.ml(g.oz)}
    </div>
    <div className={`text-right ${isHighlighted(g.name, "qt") ? "font-bold bg-yellow-200" : ""}`}>
      {fmt.qt(g.oz)}
    </div>
    <div className={`text-right ${isHighlighted(g.name, "gal") ? "font-bold bg-yellow-200" : ""}`}>
      {fmt.gal(g.oz)}
    </div>
  </div>
))}

	
	
		
      </section>
    </div>
  );
}
