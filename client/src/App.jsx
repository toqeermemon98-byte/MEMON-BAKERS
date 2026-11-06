import React, { useEffect, useMemo, useState } from 'react';
import { CakeSlice, ShoppingBag, Search, UserRound, Menu, X, Plus, Minus, Trash2, ArrowRight, Star, Clock3, MapPin, Phone, Instagram, Facebook, LogOut, LayoutDashboard, Package, Users, ClipboardList, CheckCircle2, ShieldCheck } from 'lucide-react';
const money = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;
const seedProducts = [
    { id: 1, name: 'Chocolate Fudge Cake', category: 'Cakes', price: 1850, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', description: 'Rich chocolate layers with silky fudge frosting.', tag: 'Bestseller' },
    { id: 2, name: 'Pineapple Fresh Cream Cake', category: 'Cakes', price: 1650, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85', description: 'Soft sponge, pineapple chunks and fresh cream.' },
    { id: 3, name: 'Vanilla Birthday Cake', category: 'Cakes', price: 1750, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=900&q=85', description: 'A timeless celebration cake with smooth vanilla cream.' },
    { id: 4, name: 'Butter Cake Rusk', category: 'Rusks', price: 480, image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=900&q=85', description: 'Golden, crunchy rusks made for chai time.', tag: 'Tea-time favourite' },
    { id: 5, name: 'Chocolate Chip Cookies', category: 'Biscuits', price: 550, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', description: 'Crisp edges, soft centres and chocolate chips.' },
    { id: 6, name: 'Butter Biscuits Box', category: 'Biscuits', price: 420, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85', description: 'Light, buttery biscuits baked fresh every day.' },
    { id: 7, name: 'Chocolate Éclair', category: 'Pastries', price: 260, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85', description: 'Delicate choux pastry filled with cream.' },
    { id: 8, name: 'Strawberry Cream Pastry', category: 'Pastries', price: 280, image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=85', description: 'Fluffy sponge, whipped cream and strawberry.' },
    { id: 9, name: 'Chicken Patties', category: 'Savoury', price: 180, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85', description: 'Flaky golden pastry with a savoury chicken filling.' },
    { id: 10, name: 'Mini Pizza', category: 'Savoury', price: 220, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85', description: 'Bakery-style mini pizza with cheese and herbs.' },
    { id: 11, name: 'Cinnamon Rolls', category: 'Specials', price: 320, image: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=900&q=85', description: 'Soft swirls with cinnamon sugar and glaze.' },
    { id: 12, name: 'Brownie Bites', category: 'Specials', price: 650, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', description: 'Deep cocoa brownies with a fudgy middle.' }
];
const categories = ['All', 'Cakes', 'Rusks', 'Biscuits', 'Pastries', 'Savoury', 'Specials'];
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const api = async (path, opts = {}) => { const token = localStorage.getItem('mb_token'); const res = await fetch(`${API_BASE}/api${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) } }); const data = await res.json().catch(() => ({})); if (!res.ok)
    throw new Error(data.error || 'Something went wrong'); return data; };
export default function App() {
    const [products, setProducts] = useState(seedProducts), [cart, setCart] = useState([]), [category, setCategory] = useState('All'), [search, setSearch] = useState('');
    const [user, setUser] = useState(null), [authOpen, setAuthOpen] = useState(false), [authMode, setAuthMode] = useState('login'), [authData, setAuthData] = useState({ name: '', email: '', password: '' });
    const [cartOpen, setCartOpen] = useState(false), [checkoutOpen, setCheckoutOpen] = useState(false), [mobileMenu, setMobileMenu] = useState(false), [page, setPage] = useState('shop');
    const [orders, setOrders] = useState([]), [customers, setCustomers] = useState([]), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState({ phone: '', address: '', notes: '' }), [payment, setPayment] = useState('COD');
    const [adminTab, setAdminTab] = useState('overview');
    const [newProduct, setNewProduct] = useState({ name: '', category: 'Cakes', price: '', image: '', description: '' });
    const count = cart.reduce((s, i) => s + i.qty, 0), subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
    const loadProducts = async () => { try {
        const d = await api('/products');
        if (d.products?.length)
            setProducts(d.products);
    }
    catch { } };
    const loadOrders = async () => { try {
        const d = await api(user?.role === 'admin' ? '/admin/orders' : '/orders/mine');
        setOrders(d.orders || []);
    }
    catch { } };
    const loadCustomers = async () => { try {
        const d = await api('/admin/customers');
        setCustomers(d.customers || []);
    }
    catch { } };
    useEffect(() => { loadProducts(); const token = localStorage.getItem('mb_token'); if (token)
        api('/auth/me').then(d => setUser(d.user)).catch(() => localStorage.removeItem('mb_token')); }, []);
    useEffect(() => { if (user)
        loadOrders(); }, [user]);
    const add = (p) => setCart(prev => { const f = prev.find(x => x.id === p.id); return f ? prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...p, qty: 1 }]; });
    const qty = (id, n) => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: x.qty + n } : x).filter(x => x.qty > 0));
    const show = (s) => { setNotice(s); setTimeout(() => setNotice(''), 3500); };
    const authSubmit = async (e) => { e.preventDefault(); setLoading(true); try {
        const d = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(authData) });
        localStorage.setItem('mb_token', d.token);
        setUser(d.user);
        setAuthOpen(false);
        setAuthData({ name: '', email: '', password: '' });
        show(`Welcome ${d.user.name}!`);
    }
    catch (err) {
        show(err instanceof Error ? err.message : 'Login failed');
    }
    finally {
        setLoading(false);
    } };
    const logout = () => { localStorage.removeItem('mb_token'); setUser(null); setPage('shop'); setOrders([]); show('You have been logged out.'); };
    const placeOrder = async (e) => { e.preventDefault(); if (!user) {
        setAuthOpen(true);
        setAuthMode('login');
        return;
    } setLoading(true); try {
        const d = await api('/orders', { method: 'POST', body: JSON.stringify({ items: cart.map(i => ({ product_id: i.id, quantity: i.qty })), phone: customer.phone, address: customer.address, notes: customer.notes, payment_method: payment }) });
        setCart([]);
        setCheckoutOpen(false);
        setCartOpen(false);
        show(payment === 'COD' ? `Order #${d.order.id} placed successfully!` : `Order #${d.order.id} received. Please WhatsApp us to confirm ${payment} payment.`);
        setPage('account');
        loadOrders();
    }
    catch (err) {
        show(err instanceof Error ? err.message : 'Could not place order');
    }
    finally {
        setLoading(false);
    } };
    const adminUpdate = async (id, status) => { try {
        await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
        loadOrders();
        show(`Order #${id} updated.`);
    }
    catch (e) {
        show(e instanceof Error ? e.message : 'Update failed');
    } };
    const addProduct = async (e) => { e.preventDefault(); try {
        await api('/admin/products', { method: 'POST', body: JSON.stringify({ ...newProduct, price: Number(newProduct.price) }) });
        setNewProduct({ name: '', category: 'Cakes', price: '', image: '', description: '' });
        loadProducts();
        show('Product added.');
    }
    catch (e) {
        show(e instanceof Error ? e.message : 'Could not add product');
    } };
    const deleteProduct = async (id) => { try {
        await api(`/admin/products/${id}`, { method: 'DELETE' });
        loadProducts();
        show('Product removed.');
    }
    catch (e) {
        show(e instanceof Error ? e.message : 'Delete failed');
    } };
    const admin = user?.role === 'admin';
    return <div className="app">
  <div className="topline">FRESHLY BAKED, LOVINGLY MADE <span>FRESH BAKES IN GHOTKI · ORDER ON WHATSAPP</span></div>
  <header className="header"><a className="brand" href="#" onClick={() => setPage('shop')}><span className="brand-icon"><CakeSlice /></span><span><b>MEMON BAKERS</b><small>BAKED WITH LOVE</small></span></a>
   <nav className={mobileMenu ? 'nav open' : 'nav'}><a onClick={() => { setPage('shop'); setMobileMenu(false); }}>Home</a><a href="#menu" onClick={() => { setPage('shop'); setMobileMenu(false); }}>Our Menu</a><a href="#story" onClick={() => setMobileMenu(false)}>Our Story</a>{user && <a onClick={() => { setPage('account'); setMobileMenu(false); }}>My Orders</a>}{admin && <a onClick={() => { setPage('admin'); setMobileMenu(false); }}>Admin</a>}</nav>
   <div className="head-actions"><button className="head-icon" onClick={() => document.getElementById('search')?.focus()}><Search size={18}/></button>{user ? <button className="account-btn" onClick={() => setPage(admin ? 'admin' : 'account')}><UserRound size={17}/><span>{user.name.split(' ')[0]}</span></button> : <button className="account-btn" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}><UserRound size={17}/><span>Login</span></button>}<button className="basket-btn" onClick={() => setCartOpen(true)}><ShoppingBag size={17}/><span>Basket</span><b>{count}</b></button><button className="head-icon mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button></div>
  </header>
  {page === 'shop' && <main>
   <section className="hero"><div className="hero-copy"><div className="eyebrow">YOUR NEIGHBOURHOOD BAKERY</div><h1>A little joy in<br /><em>every bite.</em></h1><p>From celebration cakes to everyday chai-time treats, discover freshly baked goodness made with care.</p><div className="hero-ctas"><a className="primary" href="#menu">Explore our menu <ArrowRight size={16}/></a><span><Star size={15}/> Made fresh daily</span></div><div className="hero-rating">★★★★★ <small>Made for sharing, loved by all</small></div></div><div className="hero-art"><div className="hero-img"></div><div className="float-card"><CakeSlice /><span><b>Fresh from the oven</b><small>Happiness, served daily</small></span></div><div className="seal">MADE<br />WITH<br /><b>LOVE</b></div></div></section>
   <section className="perks"><div><CakeSlice /><span><b>Freshly baked</b><small>Made in small batches</small></span></div><div><Star /><span><b>Quality ingredients</b><small>Goodness in every bite</small></span></div><div><Clock3 /><span><b>Made to order</b><small>For your special moments</small></span></div><div><MapPin /><span><b>Ghotki delivery</b><small>Freshness at your door</small></span></div></section>
   <section className="menu section" id="menu"><div className="section-head"><div><div className="eyebrow">A TASTE OF HAPPINESS</div><h2>Our freshly baked <em>favourites</em></h2><p>Find your new favourite, baked fresh and ready to enjoy.</p></div><label className="searchbox"><Search size={17}/><input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search treats..."/></label></div><div className="tabs">{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="products">{filtered.map(p => <article className="product" key={p.id}><div className="prod-img"><img src={p.image} alt={p.name}/>{p.tag && <label>{p.tag}</label>}<button onClick={() => add(p)} aria-label="Add to basket"><Plus /></button></div><div className="prod-body"><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p><div><b>{money(p.price)}</b><button onClick={() => add(p)}>Add to basket <Plus size={13}/></button></div></div></article>)}</div>{!filtered.length && <p className="no-results">No matching treats found.</p>}</section>
   <section className="story" id="story"><div className="story-photo"></div><div><div className="eyebrow">MADE FOR YOUR MOMENTS</div><h2>Every celebration<br />deserves a <em>sweet touch.</em></h2><p>Birthdays, family get-togethers, office treats or a little something just because — we bake every order with attention and heart.</p><a href="#menu" className="story-link">Find something special <ArrowRight size={16}/></a></div></section>
   <section className="quote"><div className="eyebrow">A LITTLE LOVE NOTE</div><b>★★★★★</b><blockquote>“The best moments are the ones we make sweeter together.”</blockquote><small>THE MEMON BAKERS PROMISE</small></section>
  </main>}
  {page === 'account' && <main className="dashboard section"><div className="eyebrow">CUSTOMER ACCOUNT</div><h2>Hello, {user?.name || 'there'}!</h2><p className="muted">Your account and order history.</p><div className="dash-actions"><button className="primary" onClick={() => setPage('shop')}>Shop treats <ArrowRight size={15}/></button><button className="outline" onClick={logout}><LogOut size={15}/> Logout</button></div><h3 className="subhead">My orders</h3><OrdersTable orders={orders}/></main>}
  {page === 'admin' && admin && <main className="admin-wrap"><aside className="admin-side"><div className="eyebrow">STORE CONTROL</div><h2>Admin panel</h2>{['overview', 'orders', 'products', 'customers'].map((t, i) => <button className={adminTab === t ? 'on' : ''} onClick={() => { setAdminTab(t); if (t === 'orders')
            loadOrders(); if (t === 'customers')
            loadCustomers(); }} key={t}>{[<LayoutDashboard />, <ClipboardList />, <Package />, <Users />][i]} {t[0].toUpperCase() + t.slice(1)}</button>)}<button onClick={logout}><LogOut /> Logout</button></aside><section className="admin-content"><div className="admin-top"><div><div className="eyebrow">MEMON BAKERS / ADMIN</div><h2>{adminTab === 'overview' ? 'Store overview' : adminTab === 'orders' ? 'Order management' : adminTab === 'products' ? 'Product management' : 'Customers'}</h2></div><button className="outline" onClick={() => { loadOrders(); loadProducts(); }}>Refresh data</button></div>
  {adminTab === 'overview' && <><div className="stats"><div><span>Total orders</span><b>{orders.length}</b><small>All time</small></div><div><span>Revenue</span><b>{money(orders.filter(o => o.payment_status === 'Paid').reduce((s, o) => s + o.total, 0))}</b><small>Based on recorded orders</small></div><div><span>Products</span><b>{products.length}</b><small>In catalogue</small></div><div><span>Pending</span><b>{orders.filter(o => o.status === 'Pending').length}</b><small>Need attention</small></div></div><h3 className="subhead">Recent orders</h3><OrdersTable orders={orders.slice(0, 5)} adminUpdate={adminUpdate}/></>}
  {adminTab === 'orders' && <OrdersTable orders={orders} adminUpdate={adminUpdate}/>}
  {adminTab === 'products' && <><form className="product-form" onSubmit={addProduct}><h3>Add a product</h3><div className="form-grid"><input required placeholder="Product name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}/><select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select><input required type="number" min="1" placeholder="Price (PKR)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}/><input placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}/><input className="wide" required placeholder="Short description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}/></div><button className="primary" type="submit">Add product <Plus size={15}/></button></form><div className="admin-products">{products.map(p => <div key={p.id}><img src={p.image} alt=""/><span><b>{p.name}</b><small>{p.category} · {money(p.price)}</small></span><button onClick={() => deleteProduct(p.id)}><Trash2 size={16}/></button></div>)}</div></>}
  {adminTab === 'customers' && <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Email</th><th>Joined</th><th>Total orders</th></tr></thead><tbody>{customers.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{new Date(c.created_at).toLocaleDateString()}</td><td>{c.orders}</td></tr>)}</tbody></table>{!customers.length && <p className="no-results">No customer accounts registered yet.</p>}</div>}
 </section></main>}
 <footer><div className="footer-grid"><div><a className="brand brand-footer" href="#"><span className="brand-icon"><CakeSlice /></span><span><b>MEMON BAKERS</b><small>BAKED WITH LOVE</small></span></a><p>Little treats, big smiles. Thank you for making us part of your special moments.</p></div><div><h4>Explore</h4><a href="#menu">Our menu</a><a href="#story">Our story</a><a onClick={() => setPage('account')}>My orders</a></div><div><h4>Get in touch</h4><p><MapPin /> Ghotki, Sindh, Pakistan</p><p><Phone /> 03021360530</p><p><Clock3 /> Daily · 9 AM – 11 PM</p><a className="primary" href="https://wa.me/923021360530" target="_blank" rel="noreferrer">Chat on WhatsApp</a></div><div><h4>Follow the sweetness</h4><p>Fresh bakes and behind-the-scenes moments.</p><div className="social"><a href="#"><Instagram /></a><a href="#"><Facebook /></a></div></div></div><div className="copyright">© 2026 Memon Bakers. All rights reserved. <span>Freshly baked with ♥ in Ghotki</span></div></footer>
  {cartOpen && <div className="shade" onMouseDown={e => { if (e.target === e.currentTarget)
        setCartOpen(false); }}><aside className="drawer"><div className="drawer-head"><div><small>YOUR GOODIES</small><h2>My basket ({count})</h2></div><button className="head-icon" onClick={() => setCartOpen(false)}><X /></button></div>{cart.length ? <><div className="cart-lines">{cart.map(i => <div className="cart-line" key={i.id}><img src={i.image}/><div><b>{i.name}</b><strong>{money(i.price)}</strong><div className="qty"><button onClick={() => qty(i.id, -1)}><Minus size={13}/></button>{i.qty}<button onClick={() => qty(i.id, 1)}><Plus size={13}/></button></div></div><button className="remove" onClick={() => qty(i.id, -i.qty)}><Trash2 size={16}/></button></div>)}</div><div className="cart-foot"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><small>Delivery charges, if any, will be confirmed by our team.</small><button className="primary full" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Proceed to checkout <ArrowRight size={16}/></button></div></> : <div className="empty"><ShoppingBag /><h3>Your basket is waiting</h3><p>Add something delicious from our menu.</p><button className="primary" onClick={() => setCartOpen(false)}>Explore menu</button></div>}</aside></div>}
  {checkoutOpen && <div className="modal-shade"><div className="modal"><button className="close" onClick={() => setCheckoutOpen(false)}><X /></button><div className="eyebrow">SECURE CHECKOUT</div><h2>Let's get it <em>delivered.</em></h2><p className="muted">Basket total: <b>{money(subtotal)}</b></p>{!user && <div className="alert">Please log in or create an account before placing an order.</div>}<form onSubmit={placeOrder}><label>Phone number<input required value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="03021360530"/></label><label>Delivery address<textarea required value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="House, street, area, Ghotki"/></label><label>Order notes (optional)<textarea value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} placeholder="Cake message, preferred time..."/></label><div className="pay-options"><label><input type="radio" checked={payment === 'COD'} onChange={() => setPayment('COD')}/> Cash on delivery</label><label><input type="radio" checked={payment === 'Card / Raast'} onChange={() => setPayment('Card / Raast')}/> Card / Raast</label><label><input type="radio" checked={payment === 'JazzCash'} onChange={() => setPayment('JazzCash')}/> JazzCash</label><label><input type="radio" checked={payment === 'Easypaisa'} onChange={() => setPayment('Easypaisa')}/> Easypaisa</label></div>{payment !== 'COD' && <p className="gateway-note"><ShieldCheck size={15}/> Your order will be saved as payment pending. Our team will share verified {payment} payment instructions on WhatsApp. Automatic online checkout requires your merchant account/API credentials.</p>}<button className="primary full" disabled={loading || !cart.length}>{loading ? 'Please wait...' : 'Place order'} <ArrowRight size={16}/></button></form></div></div>}
  {authOpen && <div className="modal-shade"><div className="modal auth-modal"><button className="close" onClick={() => setAuthOpen(false)}><X /></button><div className="eyebrow">WELCOME TO MEMON BAKERS</div><h2>{authMode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2><p className="muted">Sign in to place orders and track your treats.</p><form onSubmit={authSubmit}>{authMode === 'register' && <label>Full name<input required value={authData.name} onChange={e => setAuthData({ ...authData, name: e.target.value })}/></label>}<label>Email address<input required type="email" value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })}/></label><label>Password<input required type="password" minLength={8} value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} placeholder="At least 8 characters"/></label><button className="primary full" disabled={loading}>{loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'} <ArrowRight size={16}/></button></form><p className="switch-auth">{authMode === 'login' ? "Don't have an account?" : "Already registered?"} <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Sign up' : 'Login'}</button></p></div></div>}
  {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
  <button className="mobile-basket" onClick={() => setCartOpen(true)}><ShoppingBag />{count}</button>
 </div>;
}
function OrdersTable({ orders, adminUpdate }) {
    if (!orders.length)
        return <div className="empty-orders"><Package /><h3>No orders yet</h3><p>Orders will appear here once customers place them.</p></div>;
    return <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th>{adminUpdate && <th>Update</th>}</tr></thead><tbody>{orders.map(o => <tr key={o.id}><td>#{o.id}</td><td>{o.customer_name}<small>{o.email}</small></td><td>{new Date(o.created_at).toLocaleDateString()}</td><td>{money(o.total)}</td><td>{o.payment_method}<small>{o.payment_status}</small></td><td><span className={`status ${o.status.toLowerCase().replaceAll(' ', '-')}`}>{o.status}</span></td>{adminUpdate && <td><select value={o.status} onChange={e => adminUpdate(o.id, e.target.value)}>{['Pending', 'Confirmed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select></td>}</tr>)}</tbody></table></div>;
}
