import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();
const app=express();
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
const dataDir=path.join(process.cwd(),'data');fs.mkdirSync(dataDir,{recursive:true});
const db=new Database(path.join(dataDir,'memon-bakers.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL,image TEXT NOT NULL,description TEXT NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,customer_name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,notes TEXT,total INTEGER NOT NULL,status TEXT DEFAULT 'Pending',payment_method TEXT NOT NULL,payment_status TEXT DEFAULT 'Unpaid',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER NOT NULL,name TEXT NOT NULL,price INTEGER NOT NULL,quantity INTEGER NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id));
`);
const initial=[
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
['Brownie Bites','Specials',650,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85','Deep cocoa brownies with a fudgy middle.']
];
if(db.prepare('SELECT COUNT(*) n FROM products').get().n===0){const ins=db.prepare('INSERT INTO products(name,category,price,image,description) VALUES(?,?,?,?,?)');initial.forEach(p=>ins.run(...p));}
const adminEmail=(process.env.ADMIN_EMAIL||'admin@memonbakers.com').toLowerCase();
if(!db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)){
 const pass=process.env.ADMIN_PASSWORD||'ChangeThisAdminPassword123!';
 db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(process.env.ADMIN_NAME||'Bakery Admin',adminEmail,bcrypt.hashSync(pass,12),'admin');
}
const secret=process.env.JWT_SECRET||'development-only-change-this-secret';
type AuthedRequest=express.Request&{user?:{id:number;name:string;email:string;role:string}};
function auth(req:AuthedRequest,res:express.Response,next:express.NextFunction){const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return res.status(401).json({error:'Please login first.'});try{req.user=jwt.verify(h.slice(7),secret) as any;next()}catch{return res.status(401).json({error:'Session expired. Please login again.'})}}
function admin(req:AuthedRequest,res:express.Response,next:express.NextFunction){if(req.user?.role!=='admin')return res.status(403).json({error:'Admin access required.'});next()}
const tokenFor=(u:any)=>jwt.sign({id:u.id,name:u.name,email:u.email,role:u.role},secret,{expiresIn:'7d'});
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'Memon Bakers API'}));
app.get('/api/products',(_req,res)=>res.json({products:db.prepare('SELECT * FROM products WHERE active=1 ORDER BY id DESC').all()}));
app.post('/api/auth/register',(req,res)=>{const {name,email,password}=req.body||{};if(!name||!email||!password||String(password).length<8)return res.status(400).json({error:'Name, email and a password of at least 8 characters are required.'});try{const hash=bcrypt.hashSync(password,12);const result=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(String(name).trim(),String(email).toLowerCase(),hash);const u=db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(result.lastInsertRowid);res.json({token:tokenFor(u),user:u})}catch{return res.status(409).json({error:'An account with this email already exists.'})}});
app.post('/api/auth/login',(req,res)=>{const {email,password}=req.body||{};const u:any=db.prepare('SELECT * FROM users WHERE email=?').get(String(email||'').toLowerCase());if(!u||!bcrypt.compareSync(password||'',u.password_hash))return res.status(401).json({error:'Incorrect email or password.'});const safe={id:u.id,name:u.name,email:u.email,role:u.role};res.json({token:tokenFor(safe),user:safe})});
app.get('/api/auth/me',auth,(req:AuthedRequest,res)=>res.json({user:req.user}));
app.post('/api/orders',auth,(req:AuthedRequest,res)=>{const {items,phone,address,notes,payment_method}=req.body||{};if(!Array.isArray(items)||!items.length||!phone||!address)return res.status(400).json({error:'Add products, phone number and delivery address.'});const allowedPayments=['COD','Card / Raast','JazzCash','Easypaisa'];if(!allowedPayments.includes(String(payment_method)))return res.status(400).json({error:'Select a supported payment method.'});const ids=items.map((x:any)=>Number(x.product_id));const get=db.prepare('SELECT * FROM products WHERE id=? AND active=1');const resolved=items.map((x:any)=>{const p:any=get.get(Number(x.product_id));const quantity=Math.max(1,Math.min(50,Math.floor(Number(x.quantity)||1)));if(!p)throw new Error('A selected product is no longer available.');return {...p,quantity}});const total=resolved.reduce((s:any,p:any)=>s+p.price*p.quantity,0);const u:any=req.user;const run=db.transaction(()=>{const r=db.prepare(`INSERT INTO orders(user_id,customer_name,email,phone,address,notes,total,payment_method,payment_status) VALUES(?,?,?,?,?,?,?,?,?)`).run(u.id,u.name,u.email,String(phone),String(address),String(notes||''),total,String(payment_method),payment_method==='COD'?'Unpaid':'Pending');const addItem=db.prepare('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES(?,?,?,?,?)');resolved.forEach((p:any)=>addItem.run(r.lastInsertRowid,p.id,p.name,p.price,p.quantity));return r.lastInsertRowid});try{const id=run();res.status(201).json({order:{id,total,status:'Pending'}})}catch(e){res.status(400).json({error:e instanceof Error?e.message:'Order could not be placed.'})}});
const orderQuery=`SELECT o.*,u.name AS customer_name FROM orders o JOIN users u ON u.id=o.user_id`;
function withItems(rows:any[]){return rows.map(o=>({...o,items:db.prepare('SELECT product_id AS id,name,price,quantity AS qty FROM order_items WHERE order_id=?').all(o.id)}))}
app.get('/api/orders/mine',auth,(req:AuthedRequest,res)=>{const rows=db.prepare(`${orderQuery} WHERE o.user_id=? ORDER BY o.id DESC`).all(req.user!.id);res.json({orders:withItems(rows as any[])})});
app.get('/api/admin/orders',auth,admin,(_req,res)=>{const rows=db.prepare(`${orderQuery} ORDER BY o.id DESC`).all();res.json({orders:withItems(rows as any[])})});
app.patch('/api/admin/orders/:id/status',auth,admin,(req,res)=>{const allowed=['Pending','Confirmed','Preparing','Out for delivery','Delivered','Cancelled'];if(!allowed.includes(req.body?.status))return res.status(400).json({error:'Invalid order status.'});const r=db.prepare('UPDATE orders SET status=? WHERE id=?').run(req.body.status,Number(req.params.id));if(!r.changes)return res.status(404).json({error:'Order not found.'});res.json({ok:true})});
app.post('/api/admin/products',auth,admin,(req,res)=>{const {name,category,price,image,description}=req.body||{};if(!name||!category||!Number.isFinite(Number(price))||Number(price)<1||!description)return res.status(400).json({error:'Please complete the product details.'});const r=db.prepare('INSERT INTO products(name,category,price,image,description) VALUES(?,?,?,?,?)').run(name,category,Number(price),image||'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',description);res.status(201).json({id:r.lastInsertRowid})});
app.delete('/api/admin/products/:id',auth,admin,(req,res)=>{const r=db.prepare('UPDATE products SET active=0 WHERE id=?').run(Number(req.params.id));if(!r.changes)return res.status(404).json({error:'Product not found.'});res.json({ok:true})});
app.get('/api/admin/customers',auth,admin,(_req,res)=>{res.json({customers:db.prepare(`SELECT u.id,u.name,u.email,u.created_at,COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.role='customer' GROUP BY u.id ORDER BY u.id DESC`).all()})});
// Optional Safepay gateway adapter: deliberately fails closed until the merchant's Safepay credentials
// and the hosted-checkout flow are configured and verified. Never mark an order paid from the browser.
app.post('/api/payments/safepay/session',auth,(_req,res)=>{if(!process.env.SAFEPAY_API_KEY||!process.env.SAFEPAY_SECRET_KEY)return res.status(503).json({error:'Online payments are not activated yet. Add your Safepay sandbox/live credentials in server/.env and complete merchant onboarding.'});return res.status(501).json({error:'Safepay credentials detected, but hosted checkout session creation and verified webhook confirmation must be completed for your merchant account before live payments. COD remains available.'})});
const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`Memon Bakers API running on http://localhost:${port}`));
