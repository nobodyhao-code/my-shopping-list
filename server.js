const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = 'mongodb+srv://nobodycnmd_db_user:O70rNx8vJ7GNzIjs@nobody.sw53gvt.mongodb.net/grocery_app?retryWrites=true&w=majority';
// 连接到云端 MongoDB 数据库 / Connect to cloud MongoDB database
mongoose.connect(mongoURI).then(() => console.log('Database connected')).catch(err => console.error(err));

// 建立用户资料的数据库模型 / Define the database model for User profiles
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    consent: { type: Boolean, default: false },
    activatedCoupons: { type: [String], default: [] }
}));

// 建立购物车商品的数据库模型 / Define the database model for Cart Items
const Item = mongoose.model('Item', new mongoose.Schema({
    username: String, // 归属的用户名 / Belonging username
    name: String,
    price: Number,
    image: String,
    category: String,
    quantity: { type: Number, default: 1 }
}));

// 处理新用户注册的请求 / Handle new user registration requests
app.post('/register', async (req, res) => {
    try {
        const { username, password, email, phone, consent } = req.body;
        if (!username || !password) return res.status(400).send('Fill required fields');
        if (await User.findOne({ username })) return res.status(400).send('exists');
        
        await new User({ 
            username, 
            password, 
            email: email || '', 
            phone: phone || '', 
            consent: consent || false 
        }).save();
        res.send('success');
    } catch (error) {
        res.status(500).send('error');
    }
});

// 处理用户登录的请求 / Handle user login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // 在数据库中验证账号密码 / Verify credentials in the database
    if (await User.findOne({ username, password })) res.json({ success: true });
    else res.status(401).json({ success: false });
});

// 读取特定用户的资料 / Fetch profile data for a specific user
app.get('/api/user/:username', async (req, res) => {
    try {
        // 查找用户，但不返回密码字段 / Find user but exclude password field
        const user = await User.findOne({ username: req.params.username }, '-password');
        if (user) res.json(user);
        else res.status(404).send('Not found');
    } catch (error) {
        res.status(500).send('API error');
    }
});

// 修改并保存特定用户的资料 / Update and save profile data for a specific user
app.put('/api/user/:username', async (req, res) => {
    try {
        const { email, phone, consent } = req.body;
        await User.findOneAndUpdate(
            { username: req.params.username },
            { email, phone, consent }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).send('API error');
    }
});

// 从本地文件中读取所有可用的优惠券 / Read all available coupons from the local file
app.get('/api/coupons', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'coupons.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: '读取失败' });
    }
});

// 将优惠券与特定用户绑定 (激活) / Bind a coupon to a specific user (activation)
app.post('/api/user/:username/coupon', async (req, res) => {
    try {
        const { couponId } = req.body;
        const user = await User.findOne({ username: req.params.username });
        // 如果该优惠券尚未激活，则将其加入列表 / Add to list if coupon is not yet activated
        if (!user.activatedCoupons.includes(couponId)) {
            user.activatedCoupons.push(couponId);
            await user.save();
        }
        res.json({ success: true, activatedCoupons: user.activatedCoupons });
    } catch (error) {
        res.status(500).send('API error');
    }
});

// 从外部 API 获取商品数据并进行格式化 / Fetch and format product data from an external API
app.get('/api/products', async (req, res) => {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=150');
        const data = await response.json();
        const allowedCategories = ['groceries', 'beauty', 'skin-care', 'kitchen-accessories'];

        // 过滤指定分类的商品，并添加库存和货架信息 / Filter by category and add stock/aisle info
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

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).send('API failed');
    }
});

// 获取应用内展示的促销横幅信息 / Fetch promotional banner info for the app
app.get('/api/promotions', (req, res) => {
    res.json([{ id: 101, titleKey: 'promoTitle', detailKey: 'promoDetail' }]);
});

// 读取用户购物车里的所有商品 / Read all items in the user's shopping cart
app.get('/items/:username', async (req, res) => {
    res.json(await Item.find({ username: req.params.username }));
});

// 将新商品添加到购物车中 / Add a new item to the shopping cart
app.post('/items', async (req, res) => {
    const { username, name, price, image, category } = req.body;
    let item = await Item.findOne({ username, name });
    
    // 如果商品已存在，则数量加一 / If item exists, increase quantity by one
    if (item) {
        item.quantity += 1;
        await item.save();
        res.json(item);
    } else {
        // 如果是新商品，则创建一条新记录 / If it is a new item, create a new record
        res.json(await new Item({ username, name, price, image, category, quantity: 1 }).save());
    }
});

// 修改购物车中某个商品的数量 / Modify the quantity of a specific item in the cart
app.put('/items/:id', async (req, res) => {
    const { action } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Not found');

    if (action === 'increase') {
        // 点击加号，数量加一 / Click plus, increase quantity by one
        item.quantity += 1;
        await item.save();
    } else if (action === 'decrease') {
        // 点击减号，数量减一。如果降至零，则删除商品 / Click minus, decrease by one. If zero, delete item
        if (item.quantity > 1) {
            item.quantity -= 1;
            await item.save();
        } else {
            await Item.findByIdAndDelete(req.params.id); 
        }
    }
    res.json({ success: true });
});

// 直接从购物车中移除指定的商品 / Remove the specified item completely from the cart
app.delete('/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 验证收银台扫描的 10 位动态会员码 / Verify the 10-digit dynamic loyalty barcode scanned at checkout
app.post('/api/verify-loyalty', async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode || barcode.length !== 10) return res.json({ success: false, message: '无效的条形码格式' });

        const prefix = barcode.substring(0, 4); // 提取前 4 位用户标识 / Extract the first 4 digits (user ID)
        const codeTime = parseInt(barcode.substring(4, 10), 10); // 提取后 6 位时间戳 / Extract the last 6 digits (timestamp)
        const currentTime = parseInt(Math.floor(Date.now() / 60000).toString().slice(-6), 10); // 获取当前服务器系统时间 / Get current server time

        // 检查时间差，防伪造和防截图 / Check time difference to prevent forgery and screenshots
        if (Math.abs(currentTime - codeTime) > 1) {
            return res.json({ success: false, message: '条形码已过期，请刷新App' });
        }

        const users = await User.find({});
        let matchedUser = null;

        // 寻找与前 4 位标识匹配的注册用户 / Find the registered user matching the 4-digit prefix
        for (let user of users) {
            let numPrefix = 0;
            for (let i = 0; i < user.username.length; i++) {
                numPrefix += user.username.charCodeAt(i);
            }
            const userPrefix = (numPrefix % 10000).toString().padStart(4, '0');
            if (userPrefix === prefix) {
                matchedUser = user;
                break;
            }
        }

        // 返回最终验证结果 / Return final verification result
        if (matchedUser) {
            res.json({ success: true, username: matchedUser.username });
        } else {
            res.json({ success: false, message: '未找到匹配的会员' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 启动服务器并在 10000 端口监听请求 / Start the server and listen for requests on port 10000
app.listen(10000, () => console.log('Server running on port 10000'));