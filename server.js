const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to database / 连接云端数据库
const mongoURI = 'mongodb+srv://nobodycnmd_db_user:O70rNx8vJ7GNzIjs@nobody.sw53gvt.mongodb.net/grocery_app?retryWrites=true&w=majority';
mongoose.connect(mongoURI).then(() => console.log('Database connected / 数据库连接成功')).catch(err => console.error(err));

// Define User model / 定义用户数据模型
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// Define Item model / 定义购物车商品数据模型
const Item = mongoose.model('Item', new mongoose.Schema({
    username: String,
    name: String,
    price: Number,
    image: String,
    category: String,
    quantity: { type: Number, default: 1 }
}));

// Register new user / 注册新用户接口
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (await User.findOne({ username })) return res.status(400).send('exists');
        await new User({ username, password }).save();
        res.send('success');
    } catch (error) {
        res.status(500).send('error');
    }
});

// User login / 用户登录接口
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (await User.findOne({ username, password })) res.json({ success: true });
    else res.status(401).json({ success: false });
});

// Fetch products from API / 从外部 API 获取商品数据
app.get('/api/products', async (req, res) => {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=150');
        const data = await response.json();

        // Filter allowed categories / 过滤出允许在超市显示的分类
        const allowedCategories = ['groceries', 'beauty', 'skin-care', 'kitchen-accessories'];

        // Format API data and add virtual stock/aisle / 格式化数据并添加虚拟库存和货架号
        let formattedProducts = data.products
            .filter(item => allowedCategories.includes(item.category))
            .map(item => {
                const stock = Math.floor(Math.random() * 40); 
                const aisleLetter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); 
                const aisleNumber = String(Math.floor(Math.random() * 10) + 1).padStart(2, '0');

                return {
                    id: item.id,
                    name: item.title,
                    price: item.price,
                    unit: '500g', 
                    category: item.category,
                    image: item.thumbnail,
                    stock: stock,
                    aisle: `${aisleLetter}-${aisleNumber}`
                };
            });

        // Add custom beverage data / 合并自定义的饮料数据
        const customBeverages = [
            { id: 901, name: 'Fresh Milk', price: 5.0, unit: '1L', category: 'beverages', image: 'https://dummyimage.com/150x150/eee/333&text=Milk', stock: 20, aisle: 'C-01' },
            { id: 902, name: 'Cola Soda', price: 3.5, unit: '500ml', category: 'beverages', image: 'https://dummyimage.com/150x150/eee/333&text=Cola', stock: 35, aisle: 'C-02' },
            { id: 903, name: 'Sprite Soda', price: 3.5, unit: '500ml', category: 'beverages', image: 'https://dummyimage.com/150x150/eee/333&text=Sprite', stock: 15, aisle: 'C-02' },
            { id: 904, name: 'Orange Juice', price: 6.0, unit: '1L', category: 'beverages', image: 'https://dummyimage.com/150x150/eee/333&text=Juice', stock: 12, aisle: 'C-03' }
        ];

        formattedProducts = formattedProducts.concat(customBeverages);
        res.json(formattedProducts);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).send('API failed');
    }
});

// Fetch store promotions / 获取商店促销信息
app.get('/api/promotions', (req, res) => {
    res.json([{ id: 101, titleKey: 'promoTitle', detailKey: 'promoDetail' }]);
});

// Get user's cart / 获取指定用户的购物车记录
app.get('/items/:username', async (req, res) => {
    res.json(await Item.find({ username: req.params.username }));
});

// Add item to cart or increase quantity / 将商品加入购物车或增加数量
app.post('/items', async (req, res) => {
    const { username, name, price, image, category } = req.body;
    let item = await Item.findOne({ username, name });
    
    if (item) {
        item.quantity += 1;
        await item.save();
        res.json(item);
    } else {
        res.json(await new Item({ username, name, price, image, category, quantity: 1 }).save());
    }
});

// Adjust item quantity (+ or -) / 增加或减少购物车内商品数量
app.put('/items/:id', async (req, res) => {
    const { action } = req.body;
    const item = await Item.findById(req.params.id);
    
    if (!item) return res.status(404).send('Not found');

    if (action === 'increase') {
        item.quantity += 1;
        await item.save();
    } else if (action === 'decrease') {
        if (item.quantity > 1) {
            item.quantity -= 1;
            await item.save();
        } else {
            await Item.findByIdAndDelete(req.params.id); 
        }
    }
    res.json({ success: true });
});

// Remove item from cart / 从购物车中完全移除商品
app.delete('/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Start the server / 启动后端服务器
app.listen(10000, () => console.log('Server running on port 10000 / 服务器已启动'));