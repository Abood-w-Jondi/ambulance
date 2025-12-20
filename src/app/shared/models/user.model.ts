/**
 * Core User model for authentication and authorization
 * Separate from Driver/Paramedic which are role-specific extensions
 */
export interface User {
    // Basic Identification
    id: string;
    username?: string;
    email?: string;

    // Personal Information
    fullName: string;
    arabicName: string;
    phoneNumber?: string;
    nationalId?: string;
    dateOfBirth?: Date;

    // Address
    address?: string;
    city?: string;

    // Role & Status
    role: UserRole;
    isActive: boolean;
    isEmailVerified?: boolean;

    // Profile
    profileImageUrl?: string;

    // NEW Profile Fields (Simplified for Admins and Drivers)
    jobTitle?: string;                          // الوظيفة - Job title
    educationLevel?: 'EMI' | 'B' | 'I' | 'P';   // Education level
    palestinianNumber?: string;                 // Palestinian phone number (05XX-XXX-XXX)

    // Timestamps
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = 'admin' | 'driver' | 'paramedic';

/**
 * Login credentials
 */
export interface LoginCredentials {
    username?: string;
    email?: string;
    password: string;
}

/**
 * Login response from server
 */
export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * User registration data
 */
export interface UserRegistration {
    username?: string;
    email?: string;
    password: string;
    fullName: string;
    arabicName: string;
    role: UserRole;
    phoneNumber?: string;
}

/**
 * Token payload decoded from JWT
 */
export interface TokenPayload {
    userId: string;
    role: UserRole;
    iat: number;
    exp: number;
}
