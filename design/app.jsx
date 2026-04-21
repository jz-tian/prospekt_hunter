// Main app

function App() {
  const [page, setPage] = React.useState(() => localStorage.getItem("rh.page") || "home");
  const [week, setWeek] = React.useState(() => localStorage.getItem("rh.week") || "current");
  const [cart, setCart] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("rh.cart") || "{}"); } catch (_) { return {}; }
  });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(() => {
    try { return { ...window.TWEAK_DEFAULTS, ...(JSON.parse(localStorage.getItem("rh.tweaks") || "{}")) }; }
    catch (_) { return window.TWEAK_DEFAULTS; }
  });

  React.useEffect(() => { localStorage.setItem("rh.page", page); }, [page]);
  React.useEffect(() => { localStorage.setItem("rh.week", week); }, [week]);
  React.useEffect(() => { localStorage.setItem("rh.cart", JSON.stringify(cart)); }, [cart]);
  React.useEffect(() => { localStorage.setItem("rh.tweaks", JSON.stringify(tweaks)); }, [tweaks]);

  const addToCart = (offer) => {
    setCart(c => {
      const existing = c[offer.id];
      return {
        ...c,
        [offer.id]: existing
          ? { ...existing, qty: existing.qty + 1 }
          : { id: offer.id, retailerId: offer.retailerId, title: offer.title, unit: offer.unit, price: offer.price, was: offer.was, valid: offer.valid, qty: 1, done: false }
      };
    });
  };
  const removeItem = (id) => setCart(c => { const n = { ...c }; delete n[id]; return n; });
  const setQty = (id, qty) => setCart(c => c[id] ? { ...c, [id]: { ...c[id], qty } } : c);
  const toggleDone = (id) => setCart(c => c[id] ? { ...c, [id]: { ...c[id], done: !c[id].done } } : c);

  const cartCount = Object.values(cart).reduce((s, it) => s + it.qty, 0);
  const offers = window.OFFERS;

  let content = null;
  if (page === "home") content = <HomePage week={week} setWeek={setWeek} offers={offers} cart={cart} addToCart={addToCart} setPage={setPage} />;
  else if (page === "offers") content = <OffersPage offers={offers} cart={cart} addToCart={addToCart} />;
  else if (page === "prospekte") content = <ProspektePage />;
  else if (page === "list") content = <ShoppingListPage cart={cart} offers={offers} removeItem={removeItem} setQty={setQty} toggleDone={toggleDone} />;

  return (
    <div className="app">
      <NewsStrip />
      <Fascia page={page} setPage={setPage} cartCount={cartCount} openDrawer={() => setDrawerOpen(true)} />
      <main>{content}</main>
      <Footer />
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        removeItem={removeItem}
        setQty={setQty}
        toggleDone={toggleDone}
        goList={() => setPage("list")}
      />
      <TweaksPanel state={tweaks} setState={setTweaks} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
