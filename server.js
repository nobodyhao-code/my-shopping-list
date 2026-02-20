const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'grocery_secret_key';

mongoose.connect('mongodb://localhost:27017/grocery_app')
  .then(() => console.log('数据库已连接'))
  .catch(err => console.error('DB Error:', err));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    location: String,
    barcode: String
}));

const ShoppingList = mongoose.model('ShoppingList', new mongoose.Schema({
    userId: String,
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        isChecked: { type: Boolean, default: false }
    }]
}));

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: '无令牌' });
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: '令牌无效' });
    }
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: '用户注册成功' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: '凭证无效' });
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, userId: user._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/products', async (req, res) => {
    const { keyword } = req.query;
    const query = keyword ? { name: { $regex: keyword, $options: 'i' } } : {};
    const products = await Product.find(query);
    res.json(products);
});

app.get('/api/list', authMiddleware, async (req, res) => {
    const list = await ShoppingList.findOne({ userId: req.user.id }).populate('items.productId');
    res.json(list || { items: [] });
});

app.post('/api/list/add', authMiddleware, async (req, res) => {
    const { productId, quantity } = req.body;
    let list = await ShoppingList.findOne({ userId: req.user.id });
    if (!list) list = new ShoppingList({ userId: req.user.id, items: [] });
    
    const itemIndex = list.items.findIndex(p => p.productId.toString() === productId);
    if (itemIndex > -1) {
        list.items[itemIndex].quantity += quantity;
    } else {
        list.items.push({ productId, quantity });
    }
    await list.save();
    res.json(list);
});

app.get('/api/seed', async (req, res) => {
    await Product.deleteMany({});
    const products = [
        { name: "Organic Milk", price: 1.50, category: "Dairy", location: "Aisle 1", barcode: "1001" },
        { name: "Whole Wheat Bread", price: 2.20, category: "Bakery", location: "Aisle 2", barcode: "1002" },
        { name: "Bananas (1kg)", price: 1.80, category: "Fruit", location: "Aisle 3", barcode: "1003" },
        { name: "Coca Cola", price: 2.50, category: "Drinks", location: "Aisle 4", barcode: "1004" }
    ];
    await Product.insertMany(products);
    res.json({ message: '测试数据已生成', products });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));