import { Router } from 'express';
import { listProducts, getProductById, listCategories } from '../controllers/productController.js';
import { getProductReviews } from '../controllers/engagementController.js';

const router = Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/search', listProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);

export default router;
