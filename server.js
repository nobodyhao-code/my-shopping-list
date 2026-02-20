const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = 'mongodb+srv://nobodycnmd_db_user:O70rNx8vJ7GNzIjs@nobody.sw53gvt.mongodb.net/grocery_app?retryWrites=true&w=majority';
mongoose.connect(mongoURI).then(() => console.log('Database connected')).catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// 修改了 Item 模型，增加了 category 字段
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
        const { username, password } = req.body;
        if (await User.findOne({ username })) return res.status(400).send('exists');
        await new User({ username, password }).save();
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

app.get('/api/products', async (req, res) => {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=150');
        const data = await response.json();

        const allowedCategories = ['groceries', 'beauty', 'skin-care', 'kitchen-accessories'];

        const formattedProducts = data.products
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
        console.error('API Error:', error);
        res.status(500).send('API failed');
    }
});

// 促销接口只发送代码，具体语言在前端翻译
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

app.listen(10000, () => console.log('Server running on port 10000'));