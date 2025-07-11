import express from 'express';
// import { verifyToken } from '../middleware/verifyToken.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { adminLogin } from '../controllers/auth.controller.js';
import { createCompany ,companyList, companyDelete} from '../controllers/admin.controller.js';

const router = express.Router();

// Example of a route that requires admin role
router.get('/dashboard',
    authenticateToken,
    checkRole('admin', 'seller'),
    adminLogin
);

router.post('/company-create',
    authenticateToken,
    // checkRole('admin/'),
    createCompany
);

router.get('/company-list',
    authenticateToken,
    // checkRole('admin'),
    companyList
);

router.put('/company-delete',
    authenticateToken,
    // checkRole('admin'),
    companyDelete
);

// Example of a route that requires either admin or seller role
router.get('/products',
    authenticateToken,
    checkRole('admin', 'seller'),
    (req, res) => {
        res.json({ message: 'Product management access granted' });
    }
);

export default router; 