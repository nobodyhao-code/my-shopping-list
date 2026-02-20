const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); // 确保你的 HTML 文件在 public 文件夹里

// 1. 连接数据库 (优先使用 Render 环境变量)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_app';
mongoose.connect(mongoURI)
    .then(() => console.log('数据库连接成功！'))
    .catch(err => console.error('数据库连接失败:', err));

// 2. 定义数据模型
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ItemSchema = new mongoose.Schema({
    username: String,
    name: String,
    completed: { type: Boolean, default: false }
});
const Item = mongoose.model('Item', ItemSchema);

// 3. 注册接口
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).send('用户名和密码不能为空');
        
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).send('用户名已存在');

        const newUser = new User({ username, password });
        await newUser.save();
        res.send('注册成功！现在可以去登录了');
    } catch (error) {
        res.status(500).send('注册出错: ' + error.message);
    }
});

// 4. 登录接口
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, message: '登录成功' });
        } else {
            res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
    } catch (error) {
        res.status(500).send('登录出错');
    }
});

// 5. 获取购物清单
app.get('/items/:username', async (req, res) => {
    const items = await Item.find({ username: req.params.username });
    res.json(items);
});

// 6. 添加物品
app.post('/items', async (req, res) => {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
});

// 7. 删除物品
app.delete('/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 启动服务器
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});