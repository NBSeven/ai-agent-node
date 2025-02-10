import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './routes';

// 使用环境变量
// const secretKey = process.env.SECRET_KEY;
// console.log(`Secret Key: ${secretKey}`);


const app = new Koa();

app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

export default app;
