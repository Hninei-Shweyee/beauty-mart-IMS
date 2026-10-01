import { Router } from 'express';
import { parseOrder, pasteOrder, saveManualOrder, saveOrderFromText } from '../controllers/orderController.js';

const router = Router();

router.post('/parse', parseOrder);
router.post('/save-from-text', saveOrderFromText);
router.post('/manual', saveManualOrder);
router.post('/paste', pasteOrder);

export default router;
