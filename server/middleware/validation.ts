import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  handleValidationErrors,
];

export const weatherValidation = [
  body('crop_name').trim().notEmpty().withMessage('Crop name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('weather_condition').trim().notEmpty().withMessage('Weather condition is required'),
  body('temperature').isNumeric().withMessage('Temperature must be a number'),
  body('humidity').isNumeric().withMessage('Humidity must be a number'),
  body('rainfall').isNumeric().withMessage('Rainfall must be a number'),
  body('impact_level').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid impact level'),
  handleValidationErrors,
];

export const carbonValidation = [
  body('activity_name').trim().notEmpty().withMessage('Activity name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('co2_kg').isNumeric().withMessage('CO2 kg must be a number'),
  handleValidationErrors,
];

export const recyclingValidation = [
  body('item_name').trim().notEmpty().withMessage('Item name is required'),
  body('material_type').trim().notEmpty().withMessage('Material type is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  handleValidationErrors,
];

export const energyValidation = [
  body('device_name').trim().notEmpty().withMessage('Device name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('power_watts').isNumeric().withMessage('Power watts must be a number'),
  handleValidationErrors,
];

export const waterValidation = [
  body('source_name').trim().notEmpty().withMessage('Source name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  handleValidationErrors,
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const searchValidation = [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
  handleValidationErrors,
];

export const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required'),
  handleValidationErrors,
];

export const contactValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  handleValidationErrors,
];

export const profileValidation = [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

export const passwordChangeValidation = [
  body('currentPassword').isLength({ min: 6 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];
