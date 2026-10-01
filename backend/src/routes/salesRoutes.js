import { Router } from 'express';
import {
  deleteSaleRecord,
  exportSalesExcel,
  getSalesRecords,
  updateSaleRecord
} from '../controllers/salesController.js';

const router = Router();

router.get('/', getSalesRecords);
router.get('/export-excel', exportSalesExcel);
router.put('/:saleId/items/:itemId', updateSaleRecord);
router.delete('/:saleId', deleteSaleRecord);

export default router;
