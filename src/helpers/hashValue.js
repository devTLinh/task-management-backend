// src/helpers/hashValue.js
import bcrypt from 'bcryptjs';

export const hashValue = async (value) => {
    try {
        const salt = await bcrypt.genSalt(10); // genSaltAsync
        const hash = await bcrypt.hash(value, salt);
        return hash;
    } catch (error) {
        console.log('Error from hashValue:', error);
        throw error;
    }
};
