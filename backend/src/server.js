require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const required = ['DATABASE_URL','JWT_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing env ${key}`);
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined });
const app = express();
app.disable('x-powered-by'); app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean), credentials: false }));
app.use(express.json({limit:'1mb'}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const tokenFor = user => jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'7d',issuer:'amursk-api',audience:'amursk-client'});
const auth = asyncRoute(async(req,res,next)=>{
  const raw=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!raw) return res.status(401).json({error:'Требуется авторизация'});
  try { const p=jwt.verify(raw,process.env.JWT_SECRET,{issuer:'amursk-api',audience:'amursk-client'}); req.userId=p.sub; next(); }
  catch { return res.status(401).json({error:'Сессия недействительна'}); }
});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'amursk-api'}));
app.post('/api/auth/register',asyncRoute(async(req,res)=>{
  const {email,password,displayName}=req.body||{};
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<10||typeof displayName!=='string'||displayName.trim().length<2||displayName.length>60)
    return res.status(400).json({error:'Укажите корректную почту, имя и пароль не короче 10 символов'});
  const hash=await bcrypt.hash(password,12);
  try { const q=await pool.query('INSERT INTO users(email,password_hash,display_name) VALUES($1,$2,$3) RETURNING id,email,display_name,public_district,avatar_url,cover_url,bio,created_at',[email.toLowerCase().trim(),hash,displayName.trim()]); const user=q.rows[0]; res.status(201).json({user,token:tokenFor(user)}); }
  catch(e){ if(e.code==='23505') return res.status(409).json({error:'Эта почта уже зарегистрирована'}); throw e; }
}));
app.post('/api/auth/login',asyncRoute(async(req,res)=>{
 const {email,password}=req.body||{}; const q=await pool.query('SELECT * FROM users WHERE email=$1',[String(email||'').toLowerCase().trim()]);
 if(!q.rowCount||!await bcrypt.compare(String(password||''),q.rows[0].password_hash)) return res.status(401).json({error:'Неверная почта или пароль'});
 const u=q.rows[0]; delete u.password_hash; res.json({user:u,token:tokenFor(u)});
}));
app.get('/api/me',auth,asyncRoute(async(req,res)=>{const q=await pool.query('SELECT id,email,display_name,phone,avatar_url,cover_url,bio,public_district,created_at FROM users WHERE id=$1',[req.userId]);res.json({user:q.rows[0]||null});}));
app.patch('/api/me',auth,asyncRoute(async(req,res)=>{const {displayName,bio,publicDistrict,avatarUrl,coverUrl}=req.body||{};const q=await pool.query('UPDATE users SET display_name=COALESCE($2,display_name),bio=COALESCE($3,bio),public_district=COALESCE($4,public_district),avatar_url=COALESCE($5,avatar_url),cover_url=COALESCE($6,cover_url) WHERE id=$1 RETURNING id,email,display_name,bio,public_district,avatar_url,cover_url',[req.userId,displayName,bio,publicDistrict,avatarUrl,coverUrl]);res.json({user:q.rows[0]});}));
app.get('/api/listings',asyncRoute(async(req,res)=>{const q=await pool.query("SELECT l.id,l.category,l.subcategory,l.title,l.description,l.price,l.district,l.created_at,u.display_name AS author FROM listings l JOIN users u ON u.id=l.user_id WHERE l.status='active' ORDER BY l.created_at DESC LIMIT 100");res.json({listings:q.rows});}));
app.post('/api/listings',auth,asyncRoute(async(req,res)=>{const {category,subcategory='Другое',title,description,price=null,district=''}=req.body||{};const allowed=['Отдам даром','Подработка','Продам','Потеряно','Найдено','Транспорт','Услуги'];if(!allowed.includes(category)||typeof title!=='string'||title.trim().length<3||title.length>140||typeof description!=='string'||description.trim().length<5)return res.status(400).json({error:'Проверьте категорию, заголовок и описание'});const q=await pool.query('INSERT INTO listings(user_id,category,subcategory,title,description,price,district) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[req.userId,category,subcategory,title.trim(),description.trim(),price,district]);res.status(201).json({listing:q.rows[0]});}));
app.post('/api/conversations',auth,asyncRoute(async(req,res)=>{const {listingId}=req.body||{};const l=await pool.query('SELECT id,user_id FROM listings WHERE id=$1 AND status=\'active\'',[listingId]);if(!l.rowCount)return res.status(404).json({error:'Объявление не найдено'});if(l.rows[0].user_id===req.userId)return res.status(400).json({error:'Нельзя начать диалог с самим собой'});const client=await pool.connect();try{await client.query('BEGIN');const id=(await client.query('INSERT INTO conversations(listing_id) VALUES($1) RETURNING id',[listingId])).rows[0].id;await client.query('INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2),($1,$3)',[id,req.userId,l.rows[0].user_id]);await client.query('COMMIT');res.status(201).json({conversationId:id});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}));
app.get('/api/conversations',auth,asyncRoute(async(req,res)=>{const q=await pool.query('SELECT c.id,c.listing_id,c.created_at FROM conversations c JOIN conversation_members m ON m.conversation_id=c.id WHERE m.user_id=$1 ORDER BY c.created_at DESC',[req.userId]);res.json({conversations:q.rows});}));
app.get('/api/conversations/:id/messages',auth,asyncRoute(async(req,res)=>{const m=await pool.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[req.params.id,req.userId]);if(!m.rowCount)return res.status(403).json({error:'Нет доступа к диалогу'});const q=await pool.query('SELECT id,sender_id,body,created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 300',[req.params.id]);res.json({messages:q.rows});}));
app.post('/api/conversations/:id/messages',auth,asyncRoute(async(req,res)=>{const body=String(req.body?.body||'').trim();if(!body||body.length>4000)return res.status(400).json({error:'Сообщение должно содержать от 1 до 4000 символов'});const m=await pool.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[req.params.id,req.userId]);if(!m.rowCount)return res.status(403).json({error:'Нет доступа к диалогу'});const q=await pool.query('INSERT INTO messages(conversation_id,sender_id,body) VALUES($1,$2,$3) RETURNING id,sender_id,body,created_at',[req.params.id,req.userId,body]);res.status(201).json({message:q.rows[0]});}));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Внутренняя ошибка сервера'});});
const port=Number(process.env.PORT||3000);app.listen(port,'0.0.0.0',()=>console.log(`Amursk API listening on ${port}`));
