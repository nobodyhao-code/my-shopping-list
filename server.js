const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs'); 
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = 'mongodb+srv://nobodycnmd_db_user:O70rNx8vJ7GNzIjs@nobody.sw53gvt.mongodb.net/grocery_app?retryWrites=true&w=majority';
mongoose.connect(mongoURI).then(() => console.log('Database connected')).catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    consent: { type: Boolean, default: false },
    activatedCoupons: { type: [String], default: [] }
}));

const Item = mongoose.model('Item', new mongoose.Schema({
    username: String,
    name: String,
    price: Number,
    image: String,
    category: String,
    quantity: { type: Number, default: 1 }
}));

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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (await User.findOne({ username, password })) res.json({ success: true });
    else res.status(401).json({ success: false });
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }, '-password');
        if (user) res.json(user);
        else res.status(404).send('Not found');
    } catch (error) {
        res.status(500).send('API error');
    }
});

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

app.get('/api/coupons', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'coupons.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: '读取失败' });
    }
});

app.post('/api/user/:username/coupon', async (req, res) => {
    try {
        const { couponId } = req.body;
        const user = await User.findOne({ username: req.params.username });
        if (!user.activatedCoupons.includes(couponId)) {
            user.activatedCoupons.push(couponId);
            await user.save();
        }
        res.json({ success: true, activatedCoupons: user.activatedCoupons });
    } catch (error) {
        res.status(500).send('API error');
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=150');
        const data = await response.json();
        const allowedCategories = ['groceries', 'beauty', 'skin-care', 'kitchen-accessories'];

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

app.get('/api/promotions', (req, res) => {
    res.json([{ id: 101, titleKey: 'promoTitle', detailKey: 'promoDetail' }]);
});

app.get('/items/:username', async (req, res) => {
    res.json(await Item.find({ username: req.params.username }));
});

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

app.delete('/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post('/api/verify-loyalty', async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode || barcode.length !== 10) return res.json({ success: false, message: '无效的条形码格式' });

        const prefix = barcode.substring(0, 4);
        const codeTime = parseInt(barcode.substring(4, 10), 10);
        const currentTime = parseInt(Math.floor(Date.now() / 60000).toString().slice(-6), 10);

        if (Math.abs(currentTime - codeTime) > 1) {
            return res.json({ success: false, message: '条形码已过期，请刷新App' });
        }

        const users = await User.find({});
        let matchedUser = null;

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

        if (matchedUser) {
            res.json({ success: true, username: matchedUser.username });
        } else {
            res.json({ success: false, message: '未找到匹配的会员' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

app.listen(10000, () => console.log('Server running on port 10000'));