Smart Shopping Platform - User Guide / 智能购物平台使用说明
This guide helps you test the application and edit the code.
这份说明帮助你测试应用和修改代码。

This is a lightweight mobile web application designed for local supermarkets. It provides real product data, shopping cart management, multi-language support, and a dynamic digital loyalty card.
这是一个为本地超市设计的轻量级移动端网页应用。它提供真实的商品数据、购物车管理、多语言切换以及动态电子会员卡。

## 🌐 Live Demo / 在线演示
    * **Consumer App / 消费者 App**: [https://shopping-app-g1ru.onrender.com](https://shopping-app-g1ru.onrender.com)
    * **Cashier Simulator / 收银台模拟器**: [https://shopping-app-g1ru.onrender.com/scanner.html](https://shopping-app-g1ru.onrender.com/scanner.html)

## ⚡ Tech Stack & API / 技术栈与 API
    * **Frontend / 前端**: HTML5, CSS3, Vanilla JavaScript, JsBarcode
    * **Backend / 后端**: Node.js, Express.js
    * **Database / 数据库**: MongoDB Atlas
    * **External API / 外部接口**: DummyJSON (`https://dummyjson.com/products`)

## 💻 Local Setup / 本地运行指引
    1. **Clone repository / 克隆代码库**: `git clone https://github.com/nobodyhao-code/my-shopping-list.git`
    2. **Enter directory / 进入目录**: `cd my-shopping-list`
    3. **Install dependencies / 安装依赖**: `npm install`
    4. **Start server / 启动服务器**: `node server.js`
    5. **Open browser / 在浏览器中打开**: `http://localhost:10000`

1. How to Test the App / 如何测试应用

 * Login / 登录: Create a new account using the "Register" button. Then log in with your credentials. / 使用“注册”按钮创建新账号。然后使用该账号登录。
 * Change Language / 切换语言: Select your preferred language (EN, ZH, FI) from the dropdown menu in the top right corner. / 在右上角的下拉菜单中选择你偏好的语言。
 * Find Products / 查找商品: Use the search bar to type keywords. Use the dropdown menus to filter by category or sort by price, name, and stock. / 使用搜索框输入关键字。使用下拉菜单按分类、价格、名称和库存进行筛选。
 * Manage Cart / 管理购物车: Click the "+" button on a product card to add it to your cart. Open the cart section to increase quantities, decrease quantities, or remove items. / 点击商品卡片上的“+”按钮加入购物车。打开购物车区域增加、减少或移除商品。
2. How to Edit the Code / 如何修改代码
To change the application, you need Node.js and Git installed on your computer.
如果要修改应用，你的电脑需要安装 Node.js 和 Git。
Step 1: Download the Code / 下载代码
Open your terminal and clone the repository:
打开终端并克隆仓库：
git clone https://github.com/nobodyhao-code/my-shopping-list.git
cd my-shopping-list

Step 2: Install Dependencies / 安装依赖
Run this command to install required packages:
运行此命令安装所需的包：
npm install

Step 3: Run Locally / 本地运行
Start the local server:
启动本地服务器：
node server.js

Open your browser and go to http://localhost:10000.
打开浏览器并访问 http://localhost:10000。
3. Project File Structure / 项目文件结构
| File / 文件 | Purpose / 用途 |
|---|---|
| server.js | Backend API, database connection, and custom product data. / 后端 API、数据库连接和自定义商品数据。 |
| package.json | Lists project dependencies and startup scripts. / 列出项目依赖和启动脚本。 |
| public/index.html | Login and registration interface. / 登录和注册界面。 |
| public/list.html | Main shopping interface, cart logic, and translation dictionary. / 主购物界面、购物车逻辑和翻译词典。 |
4. How to Publish Changes / 如何发布修改
When you finish editing, commit and push your code to GitHub. Render updates the live website automatically.
修改完成后，提交并推送代码到 GitHub。Render 会自动更新在线网站。
git add .
git commit -m "Explain your changes here / 在这里写明你修改了什么"
git push
