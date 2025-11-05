import { useEffect, useState, useMemo } from "react";
import cardsData from "./data/cards.json";
import zeroCardsData from "./data/staplesZero.json";
import "./App.css";
import ChangelogPopup from "./ChangelogPopup";
import { changelog, CHANGELOG_VERSION } from "./data/changelog";

const typeOrder = [
  "normal",
  "effect",
  "ritual",
  "fusion",
  "synchro",
  "xyz",
  "spell",
  "trap",
];

// parse points filter: returns {min, max} or null
function parsePointsFilter(input) {
  const s = String(input || "").trim();
  if (!s) return null;

  // range "a-b" or "a - b"
  if (s.includes("-")) {
    const parts = s.split("-").map((p) => parseInt(p.trim(), 10));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
    }
    return null;
  }

  // single number
  const v = parseInt(s, 10);
  if (Number.isFinite(v)) return { min: v, max: v };
  return null;
}

function App() {
  const [cards, setCards] = useState([]);
  const [archetypes, setArchetypes] = useState([]); // add this
  const [showSpecial, setShowSpecial] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [sortDesc, setSortDesc] = useState(true); // true => Highest -> Lowest by points
  const [selectedArchetype, setSelectedArchetype] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");
  const [pointsFilter, setPointsFilter] = useState("");

  // Normal cards (points > 0)
  const _cards = useMemo(() => cardsData.filter(card => card.points > 0), [cardsData])

  const zeroCards = useMemo(
    () =>
      cardsData
      .filter(c => c.points == 0)
      .filter(c => zeroCardsData.includes(c.name)),
    [cardsData, zeroCardsData]
  );

  useEffect(() => {

    // 1️⃣ Determine which array to start with
    const displayedCards = showSpecial ? zeroCards : _cards;
    let filtered = [...displayedCards];

    // 2️⃣ Update archetypes dropdown based on displayedCards
    setArchetypes(
      Array.from(new Set(displayedCards.map((c) => c.archetype).filter(Boolean))).sort()
    );

    // 3️⃣ Apply archetype filter
    if (selectedArchetype) {
      filtered = filtered.filter((c) => c.archetype === selectedArchetype);
    }

    // 4️⃣ Apply type filter
    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter((c) => c.type === selectedType);
    }

    // 5️⃣ Apply search filter
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(s));
    }

    // 6️⃣ Apply points filter
    const range = parsePointsFilter(pointsFilter);
    if (range) {
      filtered = filtered.filter((c) => {
        const p = Number(c.points);
        return Number.isFinite(p) && p >= range.min && p <= range.max;
      });
    }

    // 7️⃣ Sort
    const sorted = filtered.sort((a, b) => {
      const pa = Number(a.points) || 0;
      const pb = Number(b.points) || 0;
      if (pa !== pb) return sortDesc ? pb - pa : pa - pb;

      let ia = typeOrder.indexOf(a.type);
      let ib = typeOrder.indexOf(b.type);
      if (ia === -1) ia = typeOrder.length;
      if (ib === -1) ib = typeOrder.length;
      return ia - ib;
    });

    setCards(sorted);
  }, [_cards, zeroCards, sortDesc, selectedType, selectedArchetype, search, pointsFilter, showSpecial]);

  const toggleSort = () => setSortDesc((s) => !s);

  // ✅ new effect for changelog popup
  useEffect(() => {
    try {
      const seen = localStorage.getItem("changelog_version");
      if (seen !== CHANGELOG_VERSION) {
        setShowChangelog(true);
      }
    } catch {
      setShowChangelog(true); // fallback if localStorage is blocked
    }
  }, []);

  const handleCloseChangelog = () => {
    try {
      localStorage.setItem("changelog_version", CHANGELOG_VERSION);
    } catch {
      /* ignore storage errors */
    }
    setShowChangelog(false);
  };

  return (
    <div className="container">
      <div className="controls" style={{ position: "relative" }}>
        <button onClick={() => setShowSpecial((prev) => !prev)}>
          {showSpecial ? "Show 0+ Points Cards" : "Show 0 Points Staples"}
        </button>
      </div>
      <h1>Yu-Gi-Oh! Genesys Format Helper</h1>
      <h4>Genesys Points Update: 27 Oct, 2025</h4>
      <a
        href="https://x.com/TheHelixCore"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <img
          src="https://abs.twimg.com/favicons/twitter.2.ico"
          alt="Twitter"
          style={{ width: "20px", height: "20px" }}
        />
        Follow me on Twitter
      </a>
      <h5>New features coming soon...</h5>
      <div className="controls">
        {/* Search */}
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", borderRadius: "6px" }}
        />

        {/* Points range (single or range like 100 or 10-50 or 50-10) */}
        <input
          type="text"
          placeholder="Points (e.g. 100 or 10-50)"
          value={pointsFilter}
          onChange={(e) => setPointsFilter(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", borderRadius: "6px" }}
        />

        {/* Archetype dropdown */}
        <select
          value={selectedArchetype}
          onChange={(e) => setSelectedArchetype(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", borderRadius: "6px" , width: '125px'}}
        >
          <option value="">All Archetypes</option>
          {archetypes.map((arch) => (
            <option key={arch} value={arch}>
              {arch}
            </option>
          ))}
        </select>

        {/* Type selector - options come from typeOrder (normalized values) */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", borderRadius: "6px" }}
        >
          <option value="all">All Types</option>
          {typeOrder.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>

        {/* Sort button - keeps your button style */}
        <button onClick={toggleSort}>
          Sort {sortDesc ? "Highest → Lowest" : "Lowest → Highest"}
        </button>
      </div>

      <div className="grid">
        {cards.map((card) => {
          const CardContent = (
            <>
              <img
                src={card.image}
                alt={card.name}
              />
              <p
                className="name"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  margin: "8px 0",
                  color: "#0077cc",
                  textDecoration: "none",
                }}
              >
                {card.name}
              </p>
              <p className="points">{card.points} pts</p>
            </>
          );

          return (
            <a
              key={card.id}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {CardContent}
            </a>
          );
        })}
      </div>
      {showChangelog && (
        <ChangelogPopup changelog={changelog} onClose={handleCloseChangelog} />
      )}
    </div>
  );
}

export default App;
