import Router from 'koa-router';
import { getIndex, postIndex, t, l, ln } from '../controllers/indexController';

const router = new Router();

router.get('/', getIndex);
router.post('/', postIndex);

router.post('/twitter', t);
router.post('/ltwitter', l);
router.post('/lntwitter', ln);

export default router;
