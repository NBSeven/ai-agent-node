import Router from 'koa-router';
import { getIndex, postIndex, t, l, ln, pre } from '../controllers/indexController';

const router = new Router();

router.get('/', getIndex);
router.post('/', postIndex);

router.post('/twitter', t);
router.post('/ltwitter', l);
router.post('/longtwitter', ln);
router.post('/predict', pre);


export default router;
