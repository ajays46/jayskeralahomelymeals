import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService } from '../services/admin.service.js';

export const createCompany = async (req, res, next) => {
    try {
        const { name, address_id } = req.body;
        // console.log(req.body);
        const company = await createCompanyService({ name, address_id });
        res.status(201).json({
            status: 'success',
            data: company
        });
    } catch (error) {
        next(error);
    }
}

export const companyList = async (req, res, next) => {
    try {
        const companies = await companyListService();
        res.status(200).json({
            status: 'success',
            data: companies
        });
    } catch (error) {
        next(error);
    }
}

export const companyDelete = async (req, res, next) => {
    try {
        const { id } = req.body;
        const company = await companyDeleteService(id);
        res.status(200).json({
            status: 'success',
            data: company
        });
    } catch (error) {
        next(error);
    }
}