import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService } from '../services/admin.service.js';

export const createCompany = async (req, res, next) => {
    try {
        const { name, address_id } = req.body;
        console.log(req.body);
        const company = await createCompanyService({ name, address_id });
        res.status(201).json({
            status: 'success',
            data: company
        });
    } catch (error) {
        next(error);
    }
}