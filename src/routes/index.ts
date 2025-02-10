import Router from 'koa-router';
import { getIndex, postIndex, t, l } from '../controllers/indexController';

const router = new Router();

router.get('/', getIndex);
router.post('/', postIndex);

router.post('/twitter', t);
router.post('/ltwitter', l);

export default router;
