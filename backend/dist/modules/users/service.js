import bcrypt from 'bcrypt';
import { ValidationError, NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';
export async function listUsers() {
    return repo.findAllUsers();
}
export async function createUser(data) {
    // Check for duplicate email
    const existing = await repo.findUserByEmail(data.email);
    if (existing) {
        throw new ValidationError('A user with this email already exists.', {
            email: 'Email is already taken',
        });
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    return repo.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
    });
}
export async function updateUser(id, data) {
    const existing = await repo.findUserById(id);
    if (!existing) {
        throw new NotFoundError('User', id);
    }
    return repo.updateUser(id, {
        name: data.name,
        role: data.role,
        active: data.active,
    });
}
//# sourceMappingURL=service.js.map