import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',').map((s) => s.trim()) || true,
}));
app.use(express.json({ limit: '1mb' }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
}
const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseServiceKey || 'missing-service-role-key', {
  auth: { autoRefreshToken: false, persistSession: false },
});

const secret = process.env.JWT_SECRET || 'development-only-change-this-secret';
type UserToken = { id: number; name: string; email: string; role: 'customer' | 'admin' };
type AuthedRequest = express.Request & { user?: UserToken };

function auth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Please login first.' });
  try {
    req.user = jwt.verify(header.slice(7), secret) as UserToken;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
}
function admin(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}
const tokenFor = (user: UserToken) => jwt.sign(user, secret, { expiresIn: '7d' });
const sendError = (res: express.Response, error: any, fallback = 'Something went wrong.') =>
  res.status(500).json({ error: error?.message || fallback });

const initialProducts = [
  ['Chocolate Fudge Cake','Cakes',1850,'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85','Rich chocolate layers with silky fudge frosting.'],
  ['Pineapple Fresh Cream Cake','Cakes',1650,'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85','Soft sponge, pineapple chunks and fresh cream.'],
  ['Vanilla Birthday Cake','Cakes',1750,'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=900&q=85','A timeless celebration cake with smooth vanilla cream.'],
  ['Butter Cake Rusk','Rusks',480,'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=900&q=85','Golden, crunchy rusks made for chai time.'],
  ['Chocolate Chip Cookies','Biscuits',550,'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85','Crisp edges, soft centres and chocolate chips.'],
  ['Butter Biscuits Box','Biscuits',420,'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85','Light, buttery biscuits baked fresh every day.'],
  ['Chocolate Éclair','Pastries',260,'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85','Delicate choux pastry filled with cream.'],
  ['Strawberry Cream Pastry','Pastries',280,'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=85','Fluffy sponge, whipped cream and strawberry.'],
  ['Chicken Patties','Savoury',180,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85','Flaky golden pastry with a savoury chicken filling.'],
  ['Mini Pizza','Savoury',220,'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85','Bakery-style mini pizza with cheese and herbs.'],
  ['Cinnamon Rolls','Specials',320,'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=900&q=85','Soft swirls with cinnamon sugar and glaze.'],
  ['Brownie Bites','Specials',650,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85','Deep cocoa brownies with a fudgy middle.'],
];

async function initializeStore() {
  const { count, error: countError } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (countError) throw countError;
  if ((count || 0) === 0) {
    const rows = initialProducts.map(([name, category, price, image, description]) => ({
      name, category, price, image, description, active: true,
    }));
    const { error } = await supabase.from('products').insert(rows);
    if (error) throw error;
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@memonbakers.com').toLowerCase();
  const { data: existing, error } = await supabase.from('app_users').select('id').eq('email', email).maybeSingle();
  if (error) throw error;
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.warn('ADMIN_PASSWORD is not set; admin account was not seeded.');
    } else {
      const { error: insertError } = await supabase.from('app_users').insert({
        name: process.env.ADMIN_NAME || 'Bakery Admin',
        email,
        password_hash: bcrypt.hashSync(password, 12),
        role: 'admin',
      });
      if (insertError) throw insertError;
    }
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Memon Bakers API', database: 'supabase' }));

app.get('/api/products', async (_req, res) => {
  const { data, error } = await supabase.from('products').select('*').eq('active', true).order('id', { ascending: false });
  if (error) return sendError(res, error, 'Could not load products.');
  res.json({ products: data || [] });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || String(password).length < 8) {
    return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabase.from('app_users').select('id').eq('email', normalizedEmail).maybeSingle();
  if (lookupError) return sendError(res, lookupError);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
  const { data: user, error } = await supabase.from('app_users')
    .insert({ name: String(name).trim(), email: normalizedEmail, password_hash: bcrypt.hashSync(String(password), 12), role: 'customer' })
    .select('id,name,email,role').single();
  if (error) return sendError(res, error, 'Could not create account.');
  const safeUser = user as UserToken;
  res.status(201).json({ token: tokenFor(safeUser), user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { data: user, error } = await supabase.from('app_users').select('*').eq('email', String(email || '').trim().toLowerCase()).maybeSingle();
  if (error) return sendError(res, error);
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const safeUser: UserToken = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: tokenFor(safeUser), user: safeUser });
});

app.get('/api/auth/me', auth, (req: AuthedRequest, res) => res.json({ user: req.user }));

app.post('/api/orders', auth, async (req: AuthedRequest, res) => {
  try {
    const { items, phone, address, notes, payment_method } = req.body || {};
    if (!Array.isArray(items) || !items.length || !phone || !address) {
      return res.status(400).json({ error: 'Add products, phone number and delivery address.' });
    }
    const allowedPayments = ['COD', 'Card / Raast', 'JazzCash', 'Easypaisa'];
    if (!allowedPayments.includes(String(payment_method))) return res.status(400).json({ error: 'Select a supported payment method.' });
    const quantities = items.map((item: any) => ({
      product_id: Number(item.product_id),
      quantity: Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1))),
    }));
    const productIds = [...new Set(quantities.map((item: any) => item.product_id))];
    const { data: products, error: productsError } = await supabase.from('products').select('*').in('id', productIds).eq('active', true);
    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) throw new Error('A selected product is no longer available.');
    const resolved = quantities.map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) throw new Error('A selected product is no longer available.');
      return { product_id: product.id, name: product.name, price: product.price, quantity: item.quantity };
    });
    const total = resolved.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const user = req.user!;
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: user.id, customer_name: user.name, email: user.email, phone: String(phone),
      address: String(address), notes: String(notes || ''), total, payment_method: String(payment_method),
      payment_status: payment_method === 'COD' ? 'Unpaid' : 'Pending',
    }).select('id,total,status').single();
    if (orderError) throw orderError;
    const { error: itemsError } = await supabase.from('order_items').insert(
      resolved.map((item: any) => ({ order_id: order.id, ...item }))
    );
    if (itemsError) throw itemsError;
    res.status(201).json({ order });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Order could not be placed.' });
  }
});

async function fetchOrders(userId?: number) {
  let query = supabase.from('orders').select('*').order('id', { ascending: false });
  if (userId !== undefined) query = query.eq('user_id', userId);
  const { data: orders, error } = await query;
  if (error) throw error;
  const ids = (orders || []).map((order: any) => order.id);
  const userIds = [...new Set((orders || []).map((order: any) => order.user_id))];
  const [{ data: users, error: usersError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('app_users').select('id,name').in('id', userIds.length ? userIds : [-1]),
    supabase.from('order_items').select('order_id,product_id,name,price,quantity').in('order_id', ids.length ? ids : [-1]),
  ]);
  if (usersError) throw usersError;
  if (itemsError) throw itemsError;
  return (orders || []).map((order: any) => ({
    ...order,
    customer_name: users?.find((user: any) => user.id === order.user_id)?.name || order.customer_name,
    items: (items || []).filter((item: any) => item.order_id === order.id)
      .map((item: any) => ({ id: item.product_id, name: item.name, price: item.price, qty: item.quantity })),
  }));
}

app.get('/api/orders/mine', auth, async (req: AuthedRequest, res) => {
  try { res.json({ orders: await fetchOrders(req.user!.id) }); }
  catch (error) { sendError(res, error, 'Could not load your orders.'); }
});
app.get('/api/admin/orders', auth, admin, async (_req, res) => {
  try { res.json({ orders: await fetchOrders() }); }
  catch (error) { sendError(res, error, 'Could not load orders.'); }
});
app.patch('/api/admin/orders/:id/status', auth, admin, async (req, res) => {
  const allowed = ['Pending', 'Confirmed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid order status.' });
  const { data, error } = await supabase.from('orders').update({ status: req.body.status }).eq('id', Number(req.params.id)).select('id').maybeSingle();
  if (error) return sendError(res, error);
  if (!data) return res.status(404).json({ error: 'Order not found.' });
  res.json({ ok: true });
});
app.post('/api/admin/products', auth, admin, async (req, res) => {
  const { name, category, price, image, description } = req.body || {};
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) < 1 || !description) {
    return res.status(400).json({ error: 'Please complete the product details.' });
  }
  const { data, error } = await supabase.from('products').insert({
    name, category, price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
    description, active: true,
  }).select('id').single();
  if (error) return sendError(res, error);
  res.status(201).json({ id: data.id });
});
app.delete('/api/admin/products/:id', auth, admin, async (req, res) => {
  const { data, error } = await supabase.from('products').update({ active: false }).eq('id', Number(req.params.id)).select('id').maybeSingle();
  if (error) return sendError(res, error);
  if (!data) return res.status(404).json({ error: 'Product not found.' });
  res.json({ ok: true });
});
app.get('/api/admin/customers', auth, admin, async (_req, res) => {
  const { data: users, error } = await supabase.from('app_users').select('id,name,email,created_at').eq('role', 'customer').order('id', { ascending: false });
  if (error) return sendError(res, error);
  const { data: orders, error: ordersError } = await supabase.from('orders').select('user_id');
  if (ordersError) return sendError(res, ordersError);
  const customers = (users || []).map((user: any) => ({
    ...user, orders: (orders || []).filter((order: any) => order.user_id === user.id).length,
  }));
  res.json({ customers });
});

// Online payments stay disabled until a real merchant checkout and verified webhook are configured.
app.post('/api/payments/safepay/session', auth, (_req, res) => res.status(503).json({
  error: 'Online payments are not activated yet. Configure Safepay merchant credentials and verified checkout/webhook handling first. COD remains available.',
}));

const port = Number(process.env.PORT || 4000);
initializeStore()
  .then(() => app.listen(port, () => console.log(`Memon Bakers API running on port ${port} (Supabase)`)))
  .catch((error) => {
    console.error('Could not initialize Supabase store:', error.message);
    process.exit(1);
  });
